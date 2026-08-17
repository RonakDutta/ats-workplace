import React, { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { Input } from "../components/ui/Field";
import { fetchAllCandidates } from "../services/api";
import { TONE_CLASSES, asSkillList, tierFor } from "../lib/score";
import { cn } from "../lib/cn";

export default function CandidatesView() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchAllCandidates()
      .then(setCandidates)
      .catch(() => console.error("Failed to load candidates"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((candidate) => {
      const haystack = [
        candidate.filename,
        candidate.role_title,
        ...asSkillList(candidate.matched_skills),
      ];
      return haystack.some((value) =>
        String(value ?? "").toLowerCase().includes(term),
      );
    });
  }, [candidates, query]);

  return (
    <Page>
      <PageHeader
        title="Talent pool"
        description={
          isLoading
            ? "Loading every resume you have analysed."
            : `Every resume you have analysed, across ${candidates.length} record${candidates.length === 1 ? "" : "s"}.`
        }
        actions={
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint pointer-events-none" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, role or skill"
              aria-label="Search candidates"
              className="pl-9.5 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-xs flex items-center justify-center text-faint hover:text-ink hover:bg-sunken transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        }
      />

      <Card className="mt-7 overflow-hidden">
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={query ? "No matches" : "No candidates yet"}
            description={
              query
                ? `Nothing matched "${query}". Try a different name, role or skill.`
                : "Run the engine on a role and analysed resumes will collect here."
            }
          />
        ) : (
          <>
            <CandidateTable rows={filtered} />
            <CandidateList rows={filtered} />
          </>
        )}
      </Card>

      {!isLoading && filtered.length > 0 && query && (
        <p className="t-xs text-faint mt-3 tnum">
          {filtered.length} of {candidates.length} shown
        </p>
      )}
    </Page>
  );
}

function CandidateTable({ rows }) {
  return (
    <div className="hidden md:block overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line">
            {["Candidate", "Role", "Score", "Matched skills"].map((label) => (
              <th
                key={label}
                scope="col"
                className={cn(
                  "px-6 h-12 t-xs font-medium text-faint",
                  label === "Score" && "text-right",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((candidate) => {
            const tier = tierFor(candidate.score);
            return (
              <tr
                key={candidate.id}
                className="hover:bg-line-soft transition-colors duration-100"
              >
                <td className="px-6 py-4">
                  <span className="t-body font-medium block truncate max-w-70">
                    {candidate.filename}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="t-sm text-muted block truncate max-w-56">
                    {candidate.role_title}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        TONE_CLASSES[tier.tone].dot,
                      )}
                      aria-hidden="true"
                    />
                    <span className="t-body font-medium tnum">
                      {candidate.score}%
                    </span>
                    <span className="sr-only">{tier.label}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <SkillList skills={candidate.matched_skills} limit={3} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CandidateList({ rows }) {
  return (
    <ul className="md:hidden divide-y divide-line">
      {rows.map((candidate) => {
        const tier = tierFor(candidate.score);
        return (
          <li key={candidate.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="t-body font-medium truncate">
                  {candidate.filename}
                </p>
                <p className="t-xs text-faint truncate mt-0.5">
                  {candidate.role_title}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    TONE_CLASSES[tier.tone].dot,
                  )}
                  aria-hidden="true"
                />
                <span className="t-body font-medium tnum">
                  {candidate.score}%
                </span>
              </div>
            </div>
            <div className="mt-3">
              <SkillList skills={candidate.matched_skills} limit={4} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SkillList({ skills, limit }) {
  const list = asSkillList(skills);
  if (list.length === 0) {
    return <span className="t-xs text-ghost">None recorded</span>;
  }
  const shown = list.slice(0, limit);
  const rest = list.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center h-6 px-2 rounded-xs bg-sunken border border-line-soft text-[12.5px] text-muted"
        >
          {skill}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center h-6 px-2 text-[12px] text-ghost tnum">
          +{rest}
        </span>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-4 flex-1 max-w-56" />
          <Skeleton className="h-4 flex-1 max-w-40" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 flex-1 max-w-44 rounded-xs" />
        </div>
      ))}
    </div>
  );
}
