import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ChevronDown, ChevronRight, Download, Play, Search, Upload } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import FileQueue from "../components/FileQueue";
import Button from "../components/ui/Button";
import Tabs from "../components/ui/Tabs";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import { Card, CardFooter, CardHeader } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import { ScoreMeter, VerdictTag } from "../components/ui/Score";
import { Th, TableSkeleton } from "../components/ui/Table";
import CandidateDetail from "../features/analysis/CandidateDetail";
import { deleteCandidateById, getRoleById, updateRole } from "../services/api";
import { announceRolesChanged } from "../lib/session";
import { asSkillList, averageScore, byScoreDesc } from "../lib/score";
import { analyzeFiles } from "../lib/analysis";
import { candidatesToCsv, downloadCsv, slugify } from "../lib/csv";
import { plural } from "../lib/format";
import usePdfDropzone from "../lib/usePdfDropzone";
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

const SAVE_LABELS = {
  idle: "Draft",
  saving: "Saving",
  saved: "All changes saved",
  dirty: "Unsaved changes",
};

export default function RoleWorkspace() {
  const { roleId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [queue, setQueue] = useState([]);

  const [tab, setTab] = useState("candidates");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score_desc");

  // Loading is derived from which role the data on screen belongs to.
  const [loadedRole, setLoadedRole] = useState(null);
  const [renderedRole, setRenderedRole] = useState(roleId);
  const [progress, setProgress] = useState(null);
  const [saveState, setSaveState] = useState("idle");

  const savedRef = useRef({ title: "", description: "" });
  // Pending deletions, so Undo can cancel the request before it is sent.
  const pendingDeletes = useRef(new Map());

  const isAnalyzing = progress !== null;
  const isLoading = loadedRole !== roleId;

  // Per-role view state resets during render on a route change, so a stale
  // filter never hides the new role's candidates for a frame.
  if (renderedRole !== roleId) {
    setRenderedRole(roleId);
    setQuery("");
    setQueue([]);
  }

  const { getRootProps, getInputProps, isDragActive, open } = usePdfDropzone(setQueue, {
    disabled: isAnalyzing,
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
        setExpandedId(ranked[0]?.id ?? null);
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
        await updateRole(roleId, title, description);
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
    setTab("candidates");
    const outcome = await analyzeFiles({
      roleId,
      description,
      files: [...queue],
      onProgress: setProgress,
      onResult: (rows, file) => {
        // Each resume lands as soon as it is scored, so the table fills in.
        setResults((prev) => [...rows, ...prev].sort(byScoreDesc));
        setExpandedId((current) => current ?? rows[0].id);
        setQueue((prev) => prev.filter((item) => item.name !== file.name));
      },
    });
    setProgress(null);

    if (outcome === null) {
      toast.error("Add your Gemini API key in Settings first.");
      navigate("/settings");
      return;
    }
    if (outcome.analysed === 0) {
      toast.error(
        "No resumes could be analysed. Check that your API key is valid and the files are readable PDFs.",
        { duration: 6000 },
      );
      return;
    }
    if (outcome.failed.length > 0) {
      toast(
        `${outcome.analysed} analysed. ${outcome.failed.length} could not be read and are still queued.`,
        { duration: 6000 },
      );
      return;
    }
    toast.success(`${plural(outcome.analysed, "resume")} analysed`);
  };

  // Removal is optimistic and the request waits out an undo window.
  const handleDeleteCandidate = (candidate) => {
    setResults((prev) => prev.filter((item) => item.id !== candidate.id));

    const restore = () => setResults((prev) => [candidate, ...prev].sort(byScoreDesc));
    const commit = () => {
      pendingDeletes.current.delete(candidate.id);
      deleteCandidateById(candidate.id).catch(() => {
        toast.error(`Could not remove ${candidate.filename}`);
        restore();
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
                restore();
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
    downloadCsv(`${slugify(title)}-shortlist.csv`, candidatesToCsv([...results].sort(byScoreDesc)));
    toast.success("Shortlist exported");
  };

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? results.filter((candidate) =>
          [candidate.filename, ...asSkillList(candidate.matched_skills)].some((value) =>
            String(value).toLowerCase().includes(term),
          ),
        )
      : results;
    return [...filtered].sort(SORTS[sort].compare);
  }, [results, query, sort]);

  if (isLoading) return <WorkspaceSkeleton />;

  const average = averageScore(results);
  const words = description.trim() ? description.trim().split(/\s+/).length : 0;
  const runDisabledReason =
    queue.length === 0
      ? "Add at least one resume"
      : !description.trim()
        ? "Add a job description"
        : undefined;

  return (
    <div {...getRootProps()} className="focus:outline-none min-h-full">
      <input {...getInputProps()} />

      <Page>
        <PageHeader
          crumbs={[{ label: "Overview", to: "/" }, { label: "Roles" }, { label: title || "Untitled role" }]}
          title={
            <input
              value={title}
              onChange={editField(setTitle)}
              placeholder="Untitled role"
              aria-label="Role title"
              className="w-full bg-transparent t-display text-ink -mx-1.5 px-1.5 py-0.5 rounded-sm border border-transparent hover:border-line focus:border-accent focus:outline-none placeholder:text-ghost"
            />
          }
          actions={
            <>
              {results.length > 0 && (
                <Button variant="secondary" onClick={handleExport}>
                  <Download className="size-4" />
                  Export CSV
                </Button>
              )}
              <Button variant="secondary" onClick={open} disabled={isAnalyzing}>
                <Upload className="size-4" />
                Add resumes
              </Button>
              <Button
                variant="primary"
                onClick={handleRun}
                disabled={Boolean(runDisabledReason)}
                loading={isAnalyzing}
                title={runDisabledReason}
              >
                <Play className="size-3.5" />
                {isAnalyzing
                  ? `Analysing ${progress.done + 1} of ${progress.total}`
                  : queue.length > 0
                    ? `Analyse ${plural(queue.length, "resume")}`
                    : "Analyse"}
              </Button>
            </>
          }
        />

        <dl className="flex flex-wrap gap-x-8 gap-y-2 -mt-2 mb-5 t-sm">
          <Meta label="Status">{SAVE_LABELS[saveState]}</Meta>
          <Meta label="Candidates">
            <span className="font-mono tnum">{results.length}</span>
          </Meta>
          <Meta label="Average score">
            <span className="font-mono tnum">{average ?? "None"}</span>
          </Meta>
        </dl>

        {(queue.length > 0 || isAnalyzing) && (
          <Card className="mb-5">
            <CardHeader
              title={isAnalyzing ? "Analysing" : `Ready to analyse (${queue.length})`}
              description={
                isAnalyzing
                  ? "Each resume appears in the table as soon as it is scored."
                  : "These files are queued. Run the analysis to score them against the job description."
              }
              actions={
                !isAnalyzing && (
                  <Button size="sm" variant="ghost" onClick={() => setQueue([])}>
                    Clear queue
                  </Button>
                )
              }
            />
            <div className="px-5 pt-3 pb-5 space-y-4">
              {isAnalyzing && (
                <ProgressBar
                  done={progress.done}
                  total={progress.total}
                  label={progress.file.name}
                />
              )}
              <FileQueue
                files={queue}
                disabled={isAnalyzing}
                onRemove={(file) =>
                  setQueue((prev) => prev.filter((item) => item.name !== file.name))
                }
              />
            </div>
          </Card>
        )}

        <Tabs
          className="mb-5"
          value={tab}
          onChange={setTab}
          items={[
            { value: "candidates", label: "Candidates", count: results.length },
            { value: "description", label: "Job description" },
          ]}
        />

        {tab === "candidates" ? (
          <Card>
            {results.length === 0 ? (
              <EmptyState
                title="No candidates yet"
                description="Drop PDF resumes anywhere on this page, or browse for them, then run the analysis."
                action={
                  <Button variant="primary" onClick={open}>
                    <Upload className="size-4" />
                    Add resumes
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2 px-5 py-3 border-b border-line">
                  <div className="relative flex-1 sm:max-w-72">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Filter by file name or skill"
                      aria-label="Filter candidates"
                      className="h-8 pl-8 text-[13px]"
                    />
                  </div>
                  <Select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort candidates"
                    className="h-8 sm:w-44 sm:ml-auto"
                  >
                    {Object.entries(SORTS).map(([key, option]) => (
                      <option key={key} value={key}>
                        Sort: {option.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {visible.length === 0 ? (
                  <EmptyState title="No matches" description={`Nothing matches "${query}".`} />
                ) : (
                  <CandidateTable
                    rows={visible}
                    expandedId={expandedId}
                    onToggle={(id) => setExpandedId((current) => (current === id ? null : id))}
                    onDelete={handleDeleteCandidate}
                  />
                )}
              </>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader
              title="Job description"
              description="Every resume is scored against this text. Changes save automatically."
            />
            <div className="px-5 pt-3 pb-5">
              <Textarea
                id="jd"
                aria-label="Job description"
                value={description}
                onChange={editField(setDescription)}
                disabled={isAnalyzing}
                placeholder="Paste the job description, including the responsibilities and the skills the role requires."
                className="min-h-96"
              />
            </div>
            <CardFooter>
              <p className="t-xs text-faint">
                Editing the description does not re-score existing candidates.
              </p>
              <p className="t-xs text-faint font-mono tnum">{plural(words, "word")}</p>
            </CardFooter>
          </Card>
        )}
      </Page>

      {isDragActive && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-scrim pointer-events-none p-6">
          <div className="bg-surface border-2 border-dashed border-accent rounded-md px-8 py-6 text-center">
            <p className="t-heading">Drop to add resumes</p>
            <p className="t-sm text-faint mt-1">PDF only, up to 10 MB each.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, children }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-faint">{label}</dt>
      <dd className="text-ink font-medium">{children}</dd>
    </div>
  );
}

function CandidateTable({ rows, expandedId, onToggle, onDelete }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-line bg-sunken">
          <Th className="w-px">#</Th>
          <Th>Candidate</Th>
          <Th className="w-px">Score</Th>
          <Th className="w-px hidden sm:table-cell">Verdict</Th>
          <Th className="w-px hidden md:table-cell">Skills</Th>
          <th className="w-px" aria-hidden="true" />
        </tr>
      </thead>
      {rows.map((candidate, index) => {
        const open = candidate.id === expandedId;
        const matched = asSkillList(candidate.matched_skills).length;
        const total = matched + asSkillList(candidate.missing_skills).length;
        return (
          <tbody key={candidate.id} className="border-b border-line last:border-b-0">
            <tr
              onClick={() => onToggle(candidate.id)}
              className={cn("cursor-pointer", open ? "bg-accent-soft" : "hover:bg-hover")}
            >
              <td className="pl-5 pr-2 py-3 font-mono t-sm text-faint tnum">{index + 1}</td>
              <td className="px-3 sm:px-5 py-3 w-full max-w-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggle(candidate.id);
                  }}
                  className="block w-full text-left t-sm font-medium truncate rounded-xs"
                >
                  {candidate.filename}
                </button>
              </td>
              <td className="px-3 sm:px-5 py-3">
                <ScoreMeter score={candidate.score} width="w-10 sm:w-16" />
              </td>
              <td className="px-5 py-3 hidden sm:table-cell">
                <VerdictTag score={candidate.score} />
              </td>
              <td className="px-5 py-3 hidden md:table-cell t-sm text-muted font-mono tnum whitespace-nowrap">
                {total > 0 ? `${matched} / ${total}` : "None"}
              </td>
              <td className="pl-1 pr-4 py-3 text-faint">
                {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </td>
            </tr>
            {open && (
              <tr>
                <td colSpan={6} className="p-0">
                  <CandidateDetail candidate={candidate} onDelete={onDelete} />
                </td>
              </tr>
            )}
          </tbody>
        );
      })}
    </table>
  );
}

function WorkspaceSkeleton() {
  return (
    <Page>
      <Skeleton className="w-40 h-3.5" />
      <div className="flex items-end justify-between gap-4 mt-3">
        <Skeleton className="h-8 w-72" />
        <div className="hidden sm:flex gap-2">
          <Skeleton className="h-8.5 w-28" />
          <Skeleton className="h-8.5 w-28" />
        </div>
      </div>
      <Skeleton className="w-64 h-3.5 mt-5" />
      <Skeleton className="w-52 h-6 mt-8" />
      <Card className="mt-5">
        <TableSkeleton />
      </Card>
    </Page>
  );
}
