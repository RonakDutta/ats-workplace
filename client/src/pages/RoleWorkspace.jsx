import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  ArrowDownUp,
  ArrowLeft,
  Check,
  Download,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import Button from "../components/ui/Button";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import Menu, { MenuItem } from "../components/ui/Menu";
import { Input, Textarea } from "../components/ui/Field";
import CandidateRail from "../features/analysis/CandidateRail";
import CandidateDetail from "../features/analysis/CandidateDetail";
import {
  analyzeOneCandidate,
  deleteCandidateById,
  getRoleById,
  updateRoleDraft,
} from "../services/api";
import { announceRolesChanged } from "../lib/session";
import { asSkillList, byScoreDesc } from "../lib/score";
import { candidatesToCsv, downloadCsv, slugify } from "../lib/csv";
import { cn } from "../lib/cn";

const AUTOSAVE_DELAY = 1200;
const UNDO_WINDOW = 6000;

const SORTS = {
  score_desc: { label: "Highest score", compare: byScoreDesc },
  score_asc: { label: "Lowest score", compare: (a, b) => byScoreDesc(b, a) },
  name: {
    label: "File name",
    compare: (a, b) => String(a.filename).localeCompare(String(b.filename)),
  },
};

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RoleWorkspace() {
  const { roleId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [queue, setQueue] = useState([]);

  const [tab, setTab] = useState("candidates");
  // Below lg the rail and the detail are two views rather than two panes, so
  // the list drills down instead of squeezing a 76 wide column onto a phone.
  const [mobileDetail, setMobileDetail] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score_desc");

  // Loading is derived from which role the data on screen belongs to, rather
  // than a flag toggled inside the effect that fetches it.
  const [loadedRole, setLoadedRole] = useState(null);
  const [renderedRole, setRenderedRole] = useState(roleId);
  const [progress, setProgress] = useState(null);
  const [saveState, setSaveState] = useState("idle");

  const savedRef = useRef({ title: "", description: "" });
  // Pending deletions, so Undo can cancel the request before it is sent.
  const pendingDeletes = useRef(new Map());

  const isAnalyzing = progress !== null;
  const isLoading = loadedRole !== roleId;

  // Per-role view state resets during render on a route change, which keeps a
  // stale filter from hiding the new role's candidates for a frame.
  if (renderedRole !== roleId) {
    setRenderedRole(roleId);
    setQuery("");
    setMobileDetail(false);
  }

  const onDrop = useCallback((accepted) => {
    setQueue((prev) => {
      const seen = new Set(prev.map((file) => file.name));
      return [...prev, ...accepted.filter((file) => !seen.has(file.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    noClick: true,
    noKeyboard: true,
    onDropRejected: (rejections) =>
      toast.error(
        `${rejections.length} file${rejections.length === 1 ? "" : "s"} rejected. PDFs up to 10 MB only.`,
      ),
  });

  useEffect(() => {
    let cancelled = false;
    savedRef.current = { title: "", description: "" };

    getRoleById(roleId)
      .then((data) => {
        if (cancelled) return;
        savedRef.current = {
          title: data.role.title ?? "",
          description: data.role.description ?? "",
        };
        setTitle(savedRef.current.title);
        setDescription(savedRef.current.description);

        const ranked = [...(data.candidates ?? [])].sort(byScoreDesc);
        setResults(ranked);
        setSelectedId(ranked[0]?.id ?? null);
        setMobileDetail(false);
        setTab(ranked.length > 0 ? "candidates" : "description");
        setSaveState("saved");
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load this role");
      })
      .finally(() => {
        if (!cancelled) setLoadedRole(roleId);
      });

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  useEffect(() => {
    if (isLoading) return undefined;
    if (!title.trim() || !description.trim()) return undefined;
    if (
      title === savedRef.current.title &&
      description === savedRef.current.description
    ) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSaveState("saving");
      try {
        await updateRoleDraft(roleId, title, description);
        savedRef.current = { title, description };
        setSaveState("saved");
        announceRolesChanged();
      } catch {
        setSaveState("dirty");
        toast.error("Autosave failed. Your changes are still on screen.");
      }
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [title, description, roleId, isLoading]);

  // Flush any deletion still inside its undo window if the page goes away.
  useEffect(
    () => () => {
      for (const entry of pendingDeletes.current.values()) {
        clearTimeout(entry.timer);
        deleteCandidateById(entry.candidate.id).catch(() => {});
      }
      pendingDeletes.current.clear();
    },
    [],
  );

  const editField = (setter) => (event) => {
    setter(event.target.value);
    setSaveState("dirty");
  };

  const handleRun = async () => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      toast.error("Add your Gemini API key in Settings first.");
      navigate("/settings");
      return;
    }

    const files = [...queue];
    const strictness = localStorage.getItem("ml_strictness") || 50;
    const failed = [];
    let analysed = 0;

    setProgress({ done: 0, total: files.length, label: files[0].name });
    setTab("candidates");

    for (const [index, file] of files.entries()) {
      setProgress({ done: index, total: files.length, label: file.name });
      try {
        const rows = await analyzeOneCandidate(
          description,
          file,
          roleId,
          apiKey,
          strictness,
        );
        if (rows.length === 0) {
          failed.push(file.name);
          continue;
        }
        analysed += rows.length;
        // Each resume lands as soon as it is scored, so the list fills in.
        setResults((prev) => [...rows, ...prev].sort(byScoreDesc));
        setSelectedId((current) => current ?? rows[0].id);
        setQueue((prev) => prev.filter((item) => item.name !== file.name));
      } catch {
        failed.push(file.name);
      }
    }

    setProgress(null);

    if (analysed === 0) {
      toast.error(
        "No resumes could be analysed. Check that your API key is valid and the files are readable PDFs.",
        { duration: 6000 },
      );
      return;
    }
    if (failed.length > 0) {
      toast(
        `${analysed} analysed. ${failed.length} could not be read and are still queued.`,
        { duration: 6000 },
      );
      return;
    }
    toast.success(`${analysed} resume${analysed === 1 ? "" : "s"} analysed`);
  };

  // Removal is optimistic and the request waits out an undo window, which is
  // what makes Undo possible: nothing has been destroyed yet.
  const handleDeleteCandidate = (candidate) => {
    setResults((prev) => {
      const next = prev.filter((item) => item.id !== candidate.id);
      setSelectedId((current) =>
        current === candidate.id ? (next[0]?.id ?? null) : current,
      );
      return next;
    });

    const commit = () => {
      pendingDeletes.current.delete(candidate.id);
      deleteCandidateById(candidate.id).catch(() => {
        toast.error(`Could not remove ${candidate.filename}`);
        setResults((prev) => [candidate, ...prev].sort(byScoreDesc));
      });
    };

    const timer = setTimeout(commit, UNDO_WINDOW);
    pendingDeletes.current.set(candidate.id, { candidate, timer });

    toast(
      (t) => (
        <span className="flex items-center gap-3">
          <span className="truncate">Removed {candidate.filename}</span>
          <button
            onClick={() => {
              const entry = pendingDeletes.current.get(candidate.id);
              if (entry) {
                clearTimeout(entry.timer);
                pendingDeletes.current.delete(candidate.id);
                setResults((prev) => [candidate, ...prev].sort(byScoreDesc));
              }
              toast.dismiss(t.id);
            }}
            className="link shrink-0"
          >
            Undo
          </button>
        </span>
      ),
      { duration: UNDO_WINDOW - 500 },
    );
  };

  const handleExport = () => {
    const ordered = [...results].sort(byScoreDesc);
    downloadCsv(
      `${slugify(title)}-shortlist.csv`,
      candidatesToCsv(ordered),
    );
    toast.success("Shortlist exported");
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? results.filter((candidate) =>
          [candidate.filename, ...asSkillList(candidate.matched_skills)].some(
            (value) => String(value).toLowerCase().includes(term),
          ),
        )
      : results;
    return [...filtered].sort(SORTS[sort].compare);
  }, [results, query, sort]);

  if (isLoading) return <WorkspaceSkeleton />;

  const selected =
    visible.find((item) => item.id === selectedId) ??
    results.find((item) => item.id === selectedId) ??
    visible[0];

  const averageScore = results.length
    ? Math.round(
        results.reduce((sum, item) => sum + (Number(item.score) || 0), 0) /
          results.length,
      )
    : null;

  return (
    <div {...getRootProps()} className="h-full flex flex-col focus:outline-none">
      <input {...getInputProps()} disabled={isAnalyzing} />

      <header className="shrink-0 px-5 sm:px-8 pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <input
              value={title}
              onChange={editField(setTitle)}
              placeholder="Untitled role"
              aria-label="Role title"
              className="w-full bg-transparent border-none truncate t-title text-ink -mx-2 px-2 py-0.5 rounded-sm placeholder:text-ghost placeholder:font-normal"
            />
            <p className="flex items-center gap-2 t-xs text-faint mt-1.5">
              <SaveIndicator state={saveState} />
              {results.length > 0 && (
                <>
                  <span className="text-ghost">/</span>
                  <span className="tnum">{results.length}</span> analysed
                  {averageScore != null && (
                    <>
                      <span className="text-ghost">/</span>
                      <span className="tnum">{averageScore}%</span> average
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 -mx-0.5">
            {results.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleExport}
                title="Export shortlist as CSV"
                aria-label="Export shortlist as CSV"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={open}
              disabled={isAnalyzing}
              title="Add resumes"
              aria-label="Add resumes"
            >
              <Upload className="size-4" />
              <span className="hidden sm:inline">Add resumes</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleRun}
              disabled={queue.length === 0 || !description.trim() || isAnalyzing}
              loading={isAnalyzing}
              title={
                queue.length === 0
                  ? "Add at least one resume"
                  : !description.trim()
                    ? "Add a job description"
                    : undefined
              }
            >
              {!isAnalyzing && <Sparkles className="size-4" />}
              <span className={cn(isAnalyzing && "hidden sm:inline")}>
                {isAnalyzing ? "Running" : "Run engine"}
              </span>
            </Button>
          </div>
        </div>

        {isAnalyzing && (
          <ProgressBar
            className="mt-5"
            done={progress.done}
            total={progress.total}
            label={`Analysing ${progress.label}`}
          />
        )}

        {!isAnalyzing && queue.length > 0 && (
          <div className="mt-4 rounded-lg bg-sunken p-2.5">
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="t-xs font-medium text-muted">
                <span className="tnum">{queue.length}</span> ready to analyse
              </p>
              <button
                onClick={() => setQueue([])}
                className="t-xs text-faint hover:text-ink transition-colors rounded-xs"
              >
                Clear
              </button>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {queue.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-2 h-8 pl-2.5 pr-1 rounded-xs bg-surface animate-rise"
                >
                  <FileText className="size-3.5 text-faint shrink-0" />
                  <span className="t-xs truncate max-w-40">{file.name}</span>
                  <span className="t-xs text-ghost tnum">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() =>
                      setQueue((prev) =>
                        prev.filter((item) => item.name !== file.name),
                      )
                    }
                    aria-label={`Remove ${file.name}`}
                    className="size-6 rounded-xs flex items-center justify-center text-faint hover:text-bad hover:bg-bad-soft transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Tabs
          className="mt-5"
          value={tab}
          onChange={setTab}
          items={[
            { value: "candidates", label: "Candidates", count: results.length },
            { value: "description", label: "Job description" },
          ]}
        />
      </header>

      <div className="flex-1 min-h-0">
        {tab === "candidates" ? (
          results.length === 0 ? (
            <EmptyState
              className="h-full"
              icon={Users}
              title="No candidates yet"
              description="Drop resumes anywhere on this page, then run the engine to rank them against the description."
              action={
                <Button variant="primary" onClick={open}>
                  <Upload className="size-4" />
                  Add resumes
                </Button>
              }
            />
          ) : (
            <div className="h-full flex">
              <div
                className={cn(
                  "w-full lg:w-76 shrink-0 lg:border-r border-line flex-col",
                  mobileDetail ? "hidden lg:flex" : "flex",
                )}
              >
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border-b border-line">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Filter by name or skill"
                      aria-label="Filter candidates"
                      className="h-8.5 pl-8 text-[12.5px]"
                    />
                  </div>
                  <Menu
                    width={180}
                    trigger={(props) => (
                      <button
                        {...props}
                        aria-label={`Sort: ${SORTS[sort].label}`}
                        title={`Sort: ${SORTS[sort].label}`}
                        className="size-8.5 shrink-0 rounded-sm flex items-center justify-center text-muted hover:text-ink hover:bg-sunken transition-colors"
                      >
                        <ArrowDownUp className="size-4" />
                      </button>
                    )}
                  >
                    {Object.entries(SORTS).map(([key, option]) => (
                      <MenuItem
                        key={key}
                        selected={sort === key}
                        onClick={() => setSort(key)}
                        trailing={
                          sort === key ? <Check className="size-3.5" /> : null
                        }
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
                  {visible.length === 0 ? (
                    <p className="t-xs text-ghost px-3 py-6 text-center">
                      Nothing matches "{query}".
                    </p>
                  ) : (
                    <CandidateRail
                      results={visible}
                      selectedId={selected?.id}
                      onSelect={(id) => {
                        setSelectedId(id);
                        setMobileDetail(true);
                      }}
                    />
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "flex-1 min-w-0 overflow-y-auto custom-scrollbar",
                  mobileDetail ? "block" : "hidden lg:block",
                )}
              >
                <button
                  onClick={() => setMobileDetail(false)}
                  className="lg:hidden flex items-center gap-1.5 t-sm font-medium text-muted hover:text-ink transition-colors px-5 pt-5 rounded-xs"
                >
                  <ArrowLeft className="size-4" />
                  All candidates
                </button>
                {selected && (
                  <CandidateDetail
                    key={selected.id}
                    candidate={selected}
                    onDelete={handleDeleteCandidate}
                  />
                )}
              </div>
            </div>
          )
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="mx-auto max-w-3xl px-5 sm:px-8 py-6 sm:py-7">
              <label htmlFor="jd" className="t-label text-faint">
                Job description
              </label>
              <Textarea
                bare
                id="jd"
                value={description}
                onChange={editField(setDescription)}
                disabled={isAnalyzing}
                placeholder="Paste the job description here, including the responsibilities and the skills the role requires."
                className="mt-4 min-h-96"
              />
            </div>
          </div>
        )}
      </div>

      {isDragActive && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-accent-soft/90 backdrop-blur-sm pointer-events-none">
          <p className="t-title">Drop resumes to add them</p>
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state }) {
  const config = {
    saving: { icon: Loader2, text: "Saving", spin: true },
    saved: { icon: Check, text: "Saved" },
    dirty: { icon: null, text: "Unsaved changes" },
    idle: null,
  }[state];

  if (!config) return <span>Draft</span>;
  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className={cn("size-3", config.spin && "animate-spin")} />}
      {config.text}
    </span>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="px-6 sm:px-8 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-6 w-64 rounded-sm" />
          <Skeleton className="h-3 w-40 rounded-sm" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-sm mt-6" />
      <div className="flex gap-6 mt-6">
        <div className="w-72 space-y-2 shrink-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-13 rounded-md" />
          ))}
        </div>
        <div className="flex-1 space-y-4">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
