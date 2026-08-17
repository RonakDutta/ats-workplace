import React from "react";
import { TONE_CLASSES, tierFor } from "../../lib/score";
import { cn } from "../../lib/cn";

/**
 * The ranked list. Deliberately terse: rank, score, filename. Everything else
 * lives in the detail pane, so a long shortlist stays scannable in one screen.
 */
export default function CandidateRail({ results, selectedId, onSelect }) {
  return (
    <ul className="py-1.5">
      {results.map((result, index) => {
        const tier = tierFor(result.score);
        const active = result.id === selectedId;

        return (
          <li key={result.id}>
            <button
              onClick={() => onSelect(result.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md",
                "transition-colors duration-120 ease-out-soft",
                active ? "bg-sunken" : "hover:bg-sunken/60",
              )}
            >
              <span className="t-xs text-ghost tnum w-4 shrink-0">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block t-sm font-medium truncate">
                  {result.filename}
                </span>
                <span className="block t-xs text-faint mt-0.5">
                  {tier.label}
                </span>
              </span>

              <span className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    TONE_CLASSES[tier.tone].dot,
                  )}
                  aria-hidden="true"
                />
                <span className="t-sm font-semibold tnum">{result.score}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
