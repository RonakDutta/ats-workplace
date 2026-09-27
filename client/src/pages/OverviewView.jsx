import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { Input } from "../components/ui/Field";
import { ScoreMeter } from "../components/ui/Score";
import { TableSkeleton, Th } from "../components/ui/Table";
import { averageScore, byScoreDesc } from "../lib/score";
import { formatDate } from "../lib/format";
import { cn } from "../lib/cn";
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

      <Card className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
        <Stat label="Roles" value={isLoading ? null : roles.length} />
        <Stat label="Resumes analysed" value={isLoading ? null : candidates.length} />
        <Stat
          label="Average match"
          value={isLoading ? null : average ?? "None"}
          unit={average != null ? "%" : undefined}
          className="border-t md:border-t-0 border-line"
        />
        <Stat
          label="Strong matches"
          value={isLoading ? null : strong}
          className="border-t md:border-t-0 border-line"
        />
      </Card>

      <Card className="mt-5">
        <CardHeader
          divided
          title="Roles"
          description="Each role holds one job description and every resume scored against it."
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
        />

        {isLoading ? (
          <TableSkeleton />
        ) : roles.length === 0 ? (
          <EmptyState
            title="No roles yet"
            description="Create a role, paste its job description and add resumes to rank them."
            action={
              <Button variant="primary" onClick={() => navigate("/new")}>
                Create a role
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No matching roles" description={`Nothing matches "${query}".`} />
        ) : (
          <RolesTable rows={rows} />
        )}
      </Card>
    </Page>
  );
}

function Stat({ label, value, unit, className }) {
  return (
    <div className={cn("px-5 py-4", className)}>
      <p className="t-sm text-faint">{label}</p>
      {value == null ? (
        <Skeleton className="h-7 w-14 mt-1.5" />
      ) : (
        <p className="text-[24px] font-semibold leading-tight mt-1 tnum tracking-[-0.02em]">
          {value}
          {unit && <span className="text-[15px] text-faint font-normal ml-0.5">{unit}</span>}
        </p>
      )}
    </div>
  );
}

function RolesTable({ rows }) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line bg-sunken">
            <Th>Role</Th>
            <Th className="hidden sm:table-cell">Created</Th>
            <Th className="text-right">Analysed</Th>
            <Th className="hidden md:table-cell">Average</Th>
            <Th className="hidden lg:table-cell">Top candidate</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ role, count, average, top }) => (
            <tr key={role.id} className="hover:bg-hover">
              <td className="px-5 py-3 max-w-72">
                <Link to={`/role/${role.id}`} className="link block truncate">
                  {role.title}
                </Link>
              </td>
              <td className="px-5 py-3 t-sm text-faint whitespace-nowrap hidden sm:table-cell">
                {formatDate(role.created_at)}
              </td>
              <td className="px-5 py-3 t-sm text-right font-mono tnum">{count}</td>
              <td className="px-5 py-3 hidden md:table-cell">
                {average == null ? (
                  <span className="t-sm text-ghost">Not run</span>
                ) : (
                  <ScoreMeter score={average} />
                )}
              </td>
              <td className="px-5 py-3 hidden lg:table-cell max-w-64">
                {top ? (
                  <span className="t-sm text-muted block truncate">
                    {top.filename}{" "}
                    <span className="text-faint font-mono tnum">({top.score})</span>
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
