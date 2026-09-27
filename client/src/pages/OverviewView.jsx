import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Briefcase, FileText, Gauge, Plus, Search } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import Button from "../components/ui/Button";
import { LayerCard } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import EmptyState from "../components/ui/EmptyState";
import { Input } from "../components/ui/Field";
import { ScoreMeter } from "../components/ui/Score";
import { TableSkeleton, Th } from "../components/ui/Table";
import { averageScore, byScoreDesc } from "../lib/score";
import { formatDate } from "../lib/format";
import { fetchAllCandidates, getAllRoles } from "../services/api";
import { getUser } from "../lib/session";

/**
 * Per-role figures are derived on the client by joining candidates to roles on
 * title, since the roles endpoint returns no counts.
 */
export default function OverviewView() {
  const [roles, setRoles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    Promise.all([getAllRoles(), fetchAllCandidates()])
      .then(([roleRows, candidateRows]) => {
        setRoles(roleRows ?? []);
        setCandidates(candidateRows ?? []);
      })
      .catch(() => console.error("Failed to load the overview"))
      .finally(() => setIsLoading(false));
  }, []);

  const rows = useMemo(() => {
    const byRole = new Map();
    for (const candidate of candidates) {
      if (!byRole.has(candidate.role_title)) byRole.set(candidate.role_title, []);
      byRole.get(candidate.role_title).push(candidate);
    }
    const term = query.trim().toLowerCase();
    return roles
      .filter((role) => !term || role.title.toLowerCase().includes(term))
      .map((role) => {
        const list = byRole.get(role.title) ?? [];
        return {
          role,
          count: list.length,
          average: averageScore(list),
          top: [...list].sort(byScoreDesc)[0],
        };
      });
  }, [roles, candidates, query]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const strong = candidates.filter((c) => Number(c.score) >= 80).length;
  const average = averageScore(candidates);

  return (
    <Page>
      <PageHeader
        title={firstName ? `${firstName}'s workplace` : "Overview"}
        description="Open roles and how the resumes analysed against them are scoring."
        actions={
          // The top bar carries this action from the sm breakpoint up.
          <div className="sm:hidden">
            <Button variant="primary" onClick={() => navigate("/new")}>
              <Plus className="size-4" />
              New role
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Roles" icon={Briefcase} value={isLoading ? null : roles.length} />
        <Stat label="Resumes analysed" icon={FileText} value={isLoading ? null : candidates.length} />
        <Stat
          label="Average match"
          icon={Gauge}
          value={isLoading ? null : average ?? "None"}
          unit={average != null ? "%" : undefined}
        />
        <Stat label="Strong matches" icon={Award} value={isLoading ? null : strong} />
      </div>

      <LayerCard
        className="mt-6"
        title={
          <span className="flex items-center gap-2">
            Roles
            {!isLoading && (
              <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-fill text-[12px] font-medium text-muted tnum">
                {roles.length}
              </span>
            )}
          </span>
        }
        actions={
          roles.length > 0 && (
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter roles"
                aria-label="Filter roles"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
          )
        }
      >
        {isLoading ? (
          <TableSkeleton />
        ) : roles.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No roles yet"
            description="Create a role, paste its job description and add resumes to rank them."
            action={
              <Button variant="primary" onClick={() => navigate("/new")}>
                <Plus className="size-4" />
                Create a role
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No matching roles" description={`Nothing matches "${query}".`} />
        ) : (
          <RolesTable rows={rows} />
        )}
      </LayerCard>
    </Page>
  );
}

function RolesTable({ rows }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <Th>Role</Th>
            <Th className="hidden sm:table-cell">Created</Th>
            <Th className="text-right">Analysed</Th>
            <Th className="hidden md:table-cell">Average</Th>
            <Th className="hidden lg:table-cell">Top candidate</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map(({ role, count, average, top }) => (
            <tr key={role.id} className="hover:bg-hover">
              <td className="px-4 py-3 max-w-72">
                <Link to={`/role/${role.id}`} className="flex items-center gap-2.5 min-w-0 group">
                  <span className="size-7 rounded-md bg-recessed border border-line-soft flex items-center justify-center shrink-0">
                    <FileText className="size-3.5 text-faint" />
                  </span>
                  <span className="text-[14px] font-medium text-ink truncate group-hover:text-link group-hover:underline underline-offset-2">
                    {role.title}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 t-sm text-faint whitespace-nowrap hidden sm:table-cell">
                {formatDate(role.created_at)}
              </td>
              <td className="px-4 py-3 t-sm text-right tnum">{count}</td>
              <td className="px-4 py-3 hidden md:table-cell">
                {average == null ? (
                  <span className="t-sm text-ghost">Not run</span>
                ) : (
                  <ScoreMeter score={average} />
                )}
              </td>
              <td className="px-4 py-3 hidden lg:table-cell max-w-64">
                {top ? (
                  <span className="t-sm text-muted block truncate">
                    {top.filename}{" "}
                    <span className="text-faint tnum">({top.score})</span>
                  </span>
                ) : (
                  <span className="t-sm text-ghost">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
