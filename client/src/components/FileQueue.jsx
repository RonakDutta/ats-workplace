import React from "react";
import { FileText, X } from "lucide-react";
import Button from "./ui/Button";
import { cn } from "../lib/cn";
import { formatSize } from "../lib/format";

/** Files waiting to be analysed, as a bordered list with per-row removal. */
export default function FileQueue({ files, onRemove, disabled }) {
  if (files.length === 0) return null;

  return (
    <ul className="border border-line rounded-sm divide-y divide-line">
      {files.map((file) => (
        <li key={file.name} className="flex items-center gap-3 h-10 pl-3 pr-1.5">
          <FileText className="size-4 text-faint shrink-0" />
          <span className="t-sm truncate flex-1 min-w-0">{file.name}</span>
          <span className="t-xs text-faint font-mono tnum shrink-0">
            {formatSize(file.size)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(file)}
            disabled={disabled}
            aria-label={`Remove ${file.name}`}
            className="size-7 rounded-xs flex items-center justify-center text-faint hover:text-bad hover:bg-bad-soft disabled:opacity-40"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Dashed drop target with a browse button, used above a FileQueue. */
export function DropArea({ isDragActive, onBrowse, disabled }) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4 border border-dashed rounded-sm",
        isDragActive ? "border-accent bg-accent-soft" : "border-line-strong bg-sunken",
      )}
    >
      <div>
        <p className="t-sm font-medium">
          {isDragActive ? "Release to add these files" : "Drag PDF resumes here"}
        </p>
        <p className="t-xs text-faint mt-0.5">PDF only, up to 10 MB each.</p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onBrowse}
        disabled={disabled}
        className="self-start sm:self-auto"
      >
        Browse files
      </Button>
    </div>
  );
}
