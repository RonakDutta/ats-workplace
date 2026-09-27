import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, X } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import { CardFooter, LayerCard } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { Input, Select } from "../components/ui/Field";
import { ScoreMeter, SkillTag, VerdictTag } from "../components/ui/Score";
import { TableSkeleton, Th } from "../components/ui/Table";
import { fetchAllCandidates } from "../services/api";
import { SCORE_TIERS, asSkillList, tierFor } from "../lib/score";
import { plural } from "../lib/format";

export default function CandidatesView() {
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState("all");
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
    return candidates.filter((candidate) => {
      if (verdict !== "all" && tierFor(candidate.score).id !== verdict) return false;
      if (!term) return true;
      return [candidate.filename, candidate.role_title, ...asSkillList(candidate.matched_skills)].some(
        (value) => String(value ?? "").toLowerCase().includes(term),
      );
    });
  }, [candidates, query, verdict]);

  const filtering = Boolean(query.trim()) || verdict !== "all";

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "Talent pool" }]}
        title="Talent pool"
        description="Every resume you have analysed, across all roles, ranked by score."
      />

      <LayerCard
        title="All candidates"
        actions={
          <>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, role or skill"
                aria-label="Search candidates"
                className="h-8 pl-8 pr-8 text-[13px]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Select
              value={verdict}
              onChange={(event) => setVerdict(event.target.value)}
              aria-label="Filter by verdict"
              className="h-8 w-full sm:w-40 text-[13px]"
            >
              <option value="all">All verdicts</option>
              {SCORE_TIERS.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label}
                </option>
              ))}
            </Select>
          </>
        }
      >
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtering ? "No matches" : "No candidates yet"}
            description={
              filtering
                ? "Nothing matches the current filters. Try a different name, role or skill."
                : "Analyse resumes on a role and they will be listed here."
            }
          />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <Th>Candidate</Th>
                  <Th className="hidden md:table-cell">Role</Th>
                  <Th>Score</Th>
                  <Th className="hidden sm:table-cell">Verdict</Th>
                  <Th className="hidden lg:table-cell">Matched skills</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {filtered.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-hover">
                    <td className="px-4 py-3 max-w-64">
                      <p className="text-[14px] font-medium truncate">{candidate.filename}</p>
                      <p className="t-xs text-faint truncate mt-0.5 md:hidden">{candidate.role_title}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-56">
                      <Link to={`/role/${candidate.role_id}`} className="link t-sm block truncate">
                        {candidate.role_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreMeter score={candidate.score} width="w-12" />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <VerdictTag score={candidate.score} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <SkillList skills={candidate.matched_skills} limit={3} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && candidates.length > 0 && (
          <CardFooter className="rounded-b-lg">
            <p className="t-sm text-faint">
              Showing <span className="tnum">{filtered.length}</span> of{" "}
              {plural(candidates.length, "candidate")}
            </p>
          </CardFooter>
        )}
      </LayerCard>
    </Page>
  );
}

function SkillList({ skills, limit }) {
  const list = asSkillList(skills);
  if (list.length === 0) return <span className="t-xs text-ghost">None recorded</span>;
  const rest = list.length - limit;

  return (
    <div className="flex flex-wrap gap-1.5">
      {list.slice(0, limit).map((skill) => (
        <SkillTag key={skill}>{skill}</SkillTag>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center h-6 px-1 text-[12px] text-faint tnum">
          +{rest}
        </span>
      )}
    </div>
  );
}
