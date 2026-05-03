import React from "react";
import {
  FileText,
  CheckCircle2,
  BarChart,
  Sparkles,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { deleteCandidateById } from "../../services/api";

const ScoreBadge = ({ score }) => {
  const color =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${color}`}
    >
      {score >= 80 && <CheckCircle2 className="w-3.5 h-3.5" />}
      {score}% Match
    </div>
  );
};

const SkillChip = ({ label, variant }) => {
  const color =
    variant === "matched"
      ? "bg-white text-emerald-700 border-emerald-200"
      : "bg-white text-red-600 border-red-200";
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold rounded-md border shadow-sm ${color}`}
    >
      {label}
    </span>
  );
};

const ResultsTable = ({ results, setResults }) => {
  if (!results || results.length === 0) return null;

  const handleDeleteCandidate = async (candidateId) => {
    if (window.confirm("Remove this candidate?")) {
      try {
        await deleteCandidateById(candidateId);
        setResults((prev) => prev.filter((c) => c.id !== candidateId));
        toast.success("Candidate removed");
      } catch {
        toast.error("Failed to delete candidate");
      }
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 pb-12">
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-zinc-100">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
            <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-zinc-900 tracking-tight">
              AI Analysis Results
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {results.length} candidate{results.length !== 1 ? "s" : ""} ·
              ranked by semantic score
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="flex flex-col p-4 sm:p-6 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
            >
              {/* Top row: rank + name + score + delete */}
              <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 font-bold text-xs flex items-center justify-center border border-zinc-200 shrink-0">
                    {index + 1}
                  </div>
                  {/* Filename */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 bg-zinc-50 rounded border border-zinc-200 shrink-0">
                      <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 truncate">
                      {result.filename}
                    </span>
                  </div>
                </div>

                {/* Score + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <ScoreBadge score={result.score} />
                  <button
                    onClick={() => handleDeleteCandidate(result.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="mb-4 relative overflow-hidden bg-slate-50 p-4 rounded-xl border border-indigo-100/60 shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-indigo-500" />
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    AI Insights
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed pl-1">
                  {result.ai_summary}
                </p>
              </div>

              {/* Skills — stacked on mobile, side-by-side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-3 sm:p-4 rounded-lg border border-zinc-100">
                {/* Matched */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Matched
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matched_skills?.length > 0 ? (
                      result.matched_skills.map((skill) => (
                        <SkillChip
                          key={`m-${skill}`}
                          label={skill}
                          variant="matched"
                        />
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic">
                        No exact matches.
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                      Missing
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missing_skills?.length > 0 ? (
                      result.missing_skills.map((skill) => (
                        <SkillChip
                          key={`x-${skill}`}
                          label={skill}
                          variant="missing"
                        />
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic">
                        All skills present!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsTable;
