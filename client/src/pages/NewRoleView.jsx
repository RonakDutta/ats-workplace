import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { CloudUpload, FileText, X } from "lucide-react";
import Button from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Field";
import { analyzeCandidates, saveRoleDraft } from "../services/api";
import { announceRolesChanged } from "../lib/session";
import { cn } from "../lib/cn";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * One page, one outcome. The old flow made you save a draft and then find the
 * run button as a separate step; here creating the role and analysing the first
 * batch are the same action, and resumes are optional so you can still set a
 * role up ahead of time.
 */
export default function NewRoleView() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (!title.trim()) next.title = "Give the role a name.";
    if (!description.trim()) next.description = "Paste the job description.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const toastId = toast.loading("Creating role");
    let role;
    try {
      role = await saveRoleDraft(title.trim(), description.trim());
      announceRolesChanged();
    } catch {
      toast.error("Could not create the role", { id: toastId });
      setBusy(false);
      return;
    }

    if (files.length === 0) {
      toast.success("Role created", { id: toastId });
      navigate(`/role/${role.id}`);
      return;
    }

    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      toast.error("Role created. Add your Gemini API key in Settings to run the engine.", {
        id: toastId,
        duration: 6000,
      });
      navigate("/settings");
      return;
    }

    toast.loading(`Analysing ${files.length} resume${files.length === 1 ? "" : "s"}`, {
      id: toastId,
    });
    try {
      const strictness = localStorage.getItem("ml_strictness") || 50;
      const data = await analyzeCandidates(
        description.trim(),
        files,
        role.id,
        apiKey,
        strictness,
      );
      const analysed = Array.isArray(data) ? data.length : 0;
      if (analysed === 0) {
        toast.error(
          "Role created, but no resumes could be analysed. Check your API key and that the files are readable PDFs.",
          { id: toastId, duration: 6000 },
        );
      } else {
        toast.success(
          `${analysed} resume${analysed === 1 ? "" : "s"} analysed`,
          { id: toastId },
        );
      }
    } catch {
      toast.error("Role created, but the analysis failed.", { id: toastId });
    }

    navigate(`/role/${role.id}`);
  };

  return (
    <div {...getRootProps()} className="h-full overflow-y-auto custom-scrollbar focus:outline-none">
      <input {...getInputProps()} disabled={busy} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto max-w-3xl px-5 sm:px-8 py-7 sm:py-10"
      >
        <h1 className="t-display text-balance">New role</h1>
        <p className="t-body text-muted mt-2 max-w-prose">
          Name the role, paste its description, and optionally drop in the first
          batch of resumes.
        </p>

        <div className="mt-8 space-y-6">
          <Field label="Role name" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              invalid={Boolean(errors.title)}
              placeholder="Senior Frontend Engineer"
              disabled={busy}
            />
          </Field>

          <Field
            label="Job description"
            htmlFor="description"
            error={errors.description}
            hint={
              description.trim()
                ? `${description.trim().split(/\s+/).length} words`
                : "Every resume is scored against this text."
            }
          >
            <Textarea
              id="description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              invalid={Boolean(errors.description)}
              placeholder="Paste the responsibilities and the required skills."
              className="min-h-56"
              disabled={busy}
            />
          </Field>

          <div>
            <p className="t-sm font-medium text-muted mb-1.5">
              Resumes <span className="text-ghost">optional</span>
            </p>
            <div
              className={cn(
                "rounded-lg border border-dashed px-5 py-8 text-center transition-colors duration-150",
                isDragActive
                  ? "border-accent bg-accent-soft"
                  : "border-line-strong bg-sunken/50",
              )}
            >
              <CloudUpload
                className={cn(
                  "size-6 mx-auto mb-3",
                  isDragActive ? "text-accent" : "text-faint",
                )}
              />
              <p className="t-sm font-medium">
                {isDragActive ? "Drop to add" : "Drag PDFs here"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3.5"
                onClick={open}
                disabled={busy}
              >
                Browse files
              </Button>
            </div>

            {files.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 mt-3">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center gap-2 h-8 pl-2.5 pr-1 rounded-xs bg-sunken animate-rise"
                  >
                    <FileText className="size-3.5 text-faint shrink-0" />
                    <span className="t-xs truncate max-w-44">{file.name}</span>
                    <span className="t-xs text-ghost tnum">
                      {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) =>
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
            )}
          </div>
        </div>

        <div className="flex mt-8">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={busy}
            className="w-full sm:w-auto sm:ml-auto justify-center"
          >
            {files.length > 0
              ? `Create and analyse ${files.length} resume${files.length === 1 ? "" : "s"}`
              : "Create role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
