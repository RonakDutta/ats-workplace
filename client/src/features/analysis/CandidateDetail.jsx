import React from "react";
import { Check, Minus, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import ScoreRing from "../../components/ui/ScoreRing";
import { asSkillList, tierFor } from "../../lib/score";
import { cn } from "../../lib/cn";

export default function CandidateDetail({ candidate, onDelete }) {
  const tier = tierFor(candidate.score);
  const matched = asSkillList(candidate.matched_skills);
  const missing = asSkillList(candidate.missing_skills);
  const coverage = matched.length + missing.length;

  return (
    <article className="px-5 sm:px-8 py-6 sm:py-7 max-w-3xl">
      <header className="flex items-start gap-4 sm:gap-5">
        <ScoreRing score={candidate.score} size={56} />

        <div className="min-w-0 flex-1">
          <h2 className="t-title break-all sm:truncate">{candidate.filename}</h2>
          <p className="t-sm text-muted mt-1.5">
            {tier.label}
            {coverage > 0 && (
              <>
                <span className="text-ghost mx-2">/</span>
                <span className="tnum">{matched.length}</span> of{" "}
                <span className="tnum">{coverage}</span> required skills present
              </>
            )}
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(candidate)}
          className="shrink-0"
          aria-label={`Remove ${candidate.filename}`}
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">Remove</span>
        </Button>
      </header>

      {/* A coverage bar reads faster than counting chips, and the track is a
          lighter step of the same colour so the state reads across the whole
          width rather than only the filled part. */}
      {coverage > 0 && (
        <div
          className="mt-6 h-1.5 rounded-full bg-line overflow-hidden"
          role="img"
          aria-label={`${matched.length} of ${coverage} required skills present`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out-soft"
            style={{
              width: `${(matched.length / coverage) * 100}%`,
              backgroundColor: `var(--${tier.tone}-mark)`,
            }}
          />
        </div>
      )}

      {candidate.ai_summary && (
        <section className="mt-7">
          <h3 className="t-label text-faint mb-2.5">Summary</h3>
          <p className="t-body text-muted max-w-prose">
            {candidate.ai_summary}
          </p>
        </section>
      )}

      <div className="grid gap-6 sm:grid-cols-2 mt-8">
        <SkillGroup
          label="Matched"
          icon={Check}
          tone="good"
          skills={matched}
          empty="No required skill was found in this resume."
        />
        <SkillGroup
          label="Missing"
          icon={Minus}
          tone="bad"
          skills={missing}
          empty="Every required skill is covered."
        />
      </div>
    </article>
  );
}

function SkillGroup({ label, icon: Icon, tone, skills, empty }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 mb-3">
        <Icon className={cn("size-3.5", tone === "good" ? "text-good" : "text-bad")} />
        <span className="t-label text-faint">{label}</span>
        {skills.length > 0 && (
          <span className="t-xs text-ghost tnum">{skills.length}</span>
        )}
      </h3>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className={cn(
                "inline-flex items-center h-7 px-2.5 rounded-xs text-[12.5px]",
                tone === "good"
                  ? "bg-sunken text-muted"
                  : "border border-dashed border-line text-faint",
              )}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="t-sm text-ghost">{empty}</p>
      )}
    </section>
  );
}
