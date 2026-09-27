import React from "react";
import { Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { ScoreMeter, SkillTag, VerdictTag } from "../../components/ui/Score";
import { asSkillList } from "../../lib/score";

/** Expanded view of one candidate, shown inline below its table row. */
export default function CandidateDetail({ candidate, onDelete }) {
  const matched = asSkillList(candidate.matched_skills);
  const missing = asSkillList(candidate.missing_skills);
  const coverage = matched.length + missing.length;

  return (
    <div className="px-4 sm:px-5 py-5 bg-sunken border-t border-line-soft">
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
        <Meta label="Score">
          <ScoreMeter score={candidate.score} width="w-20" />
        </Meta>
        <Meta label="Verdict">
          <VerdictTag score={candidate.score} long />
        </Meta>
        <Meta label="Required skills covered">
          <span className="tnum">
            {coverage > 0 ? `${matched.length} of ${coverage}` : "None listed"}
          </span>
        </Meta>
        <Meta label="File">
          <span className="block truncate" title={candidate.filename}>
            {candidate.filename}
          </span>
        </Meta>
      </dl>

      {candidate.ai_summary && (
        <div className="mt-5">
          <h3 className="t-label">Summary</h3>
          <p className="t-body text-ink mt-1.5 max-w-prose bg-surface border border-line rounded-lg shadow-xs px-4 py-3">{candidate.ai_summary}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 mt-5">
        <SkillGroup
          label="Matched"
          skills={matched}
          empty="None of the required skills were found."
        />
        <SkillGroup
          label="Missing"
          missing
          skills={missing}
          empty="Every required skill is covered."
        />
      </div>

      <div className="flex justify-end mt-5 pt-4 border-t border-line-soft">
        <Button size="sm" variant="danger" onClick={() => onDelete(candidate)}>
          <Trash2 className="size-3.5" />
          Remove candidate
        </Button>
      </div>
    </div>
  );
}

function Meta({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="t-label">{label}</dt>
      <dd className="t-sm mt-1">{children}</dd>
    </div>
  );
}

function SkillGroup({ label, skills, missing, empty }) {
  return (
    <div>
      <h3 className="t-label">
        {label} <span className="font-normal tnum">({skills.length})</span>
      </h3>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((skill) => (
            <SkillTag key={skill} missing={missing}>
              {skill}
            </SkillTag>
          ))}
        </div>
      ) : (
        <p className="t-sm text-faint mt-1.5">{empty}</p>
      )}
    </div>
  );
}
