import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Plus } from "lucide-react";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import { TONE_CLASSES, asSkillList, tierFor } from "../lib/score";
import { fetchAllCandidates, getAllRoles } from "../services/api";
import { getUser } from "../lib/session";
import { cn } from "../lib/cn";

/**
 * Landing on an empty editor told you nothing. This does: what is open, how
 * much has been analysed and where each role stands.
 *
 * Per-role figures are derived on the client by joining candidates to roles on
 * title, since the roles endpoint returns no counts and this needs no server
 * change.
 */
export default function OverviewView() {
  const [roles, setRoles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const summary = useMemo(() => {
    const byRole = new Map();
    for (const candidate of candidates) {
      const key = candidate.role_title;
      if (!byRole.has(key)) byRole.set(key, []);
      byRole.get(key).push(candidate);
    }

    const scores = candidates.map((c) => Number(c.score) || 0);
    const strong = scores.filter((score) => score >= 80).length;

    return {
      byRole,
      total: candidates.length,
      strong,
      average: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    };
  }, [candidates]);

  if (isLoading) return <OverviewSkeleton />;

  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-7 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="t-display text-balance">
            {firstName ? `Hello, ${firstName}` : "Overview"}
          </h1>
          <p className="t-body text-muted mt-2">
            {roles.length === 0
              ? "Start by describing a role, then drop in the resumes you want ranked."
              : `${roles.length} open role${roles.length === 1 ? "" : "s"} in your workplace.`}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate("/new")}
          className="self-start shrink-0"
        >
          <Plus className="size-4" />
          New role
        </Button>
      </div>

      {summary.total > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-7 sm:mt-8">
          <Stat label="Resumes analysed" value={summary.total} />
          <Stat label="Average match" value={summary.average} unit="%" />
          <Stat label="Strong matches" value={summary.strong} />
        </div>
      )}

      <section className="mt-9">
        <h2 className="t-label text-faint mb-3">Roles</h2>

        {roles.length === 0 ? (
          <div className="rounded-lg bg-sunken">
            <EmptyState
              icon={Plus}
              title="No roles yet"
              description="A role holds one job description and every resume scored against it."
              action={
                <Button variant="primary" onClick={() => navigate("/new")}>
                  Create your first role
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                candidates={summary.byRole.get(role.title) ?? []}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="rounded-lg bg-sunken px-3.5 sm:px-5 py-3.5 sm:py-4">
      <p className="t-xs text-faint">{label}</p>
      <p className="text-[22px] sm:text-[26px] font-semibold leading-none mt-2 sm:mt-2.5 tracking-[-0.026em]">
        {value}
        {unit && <span className="text-[14px] sm:text-[16px] text-faint ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function RoleCard({ role, candidates }) {
  const top = [...candidates].sort(
    (a, b) => (Number(b.score) || 0) - (Number(a.score) || 0),
  )[0];
  const tier = top ? tierFor(top.score) : null;

  return (
    <li>
      <Link
        to={`/role/${role.id}`}
        className={cn(
          "group block h-full rounded-lg bg-sunken p-5",
          "transition-colors duration-150 ease-out-soft hover:bg-line-soft",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="t-body font-medium truncate">{role.title}</h3>
          <ArrowUpRight className="size-4 text-ghost shrink-0 transition-colors group-hover:text-muted" />
        </div>

        <p className="t-xs text-faint mt-1.5 tnum">
          {candidates.length === 0
            ? "Nothing analysed yet"
            : `${candidates.length} analysed`}
        </p>

        {top && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                TONE_CLASSES[tier.tone].dot,
              )}
              aria-hidden="true"
            />
            <span className="t-xs text-muted truncate flex-1 min-w-0">
              Top: {top.filename}
            </span>
            <span className="t-xs font-semibold tnum shrink-0">
              {top.score}%
            </span>
          </div>
        )}

        {top && asSkillList(top.matched_skills).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {asSkillList(top.matched_skills)
              .slice(0, 3)
              .map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center h-6 px-2 rounded-xs bg-surface t-xs text-muted"
                >
                  {skill}
                </span>
              ))}
          </div>
        )}
      </Link>
    </li>
  );
}

function OverviewSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8 py-7 sm:py-10">
      <Skeleton className="h-9 w-56 rounded-md" />
      <Skeleton className="h-4 w-80 rounded-sm mt-4" />
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-7 sm:mt-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-22 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 mt-9">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
