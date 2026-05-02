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

const ResultsTable = ({ results, setResults }) => {
  if (!results || results.length === 0) return null;

  const handleDeleteCandidate = async (candidateId) => {
    if (window.confirm("Are you sure you want to remove this candidate?")) {
      try {
        await deleteCandidateById(candidateId);
        setResults((prev) =>
          prev.filter((candidate) => candidate.id !== candidateId),
        );
        toast.success("Candidate removed");
      } catch (error) {
        toast.error("Failed to delete candidate");
      }
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 mt-4 pb-12">
      <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <BarChart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              AI Analysis Results
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Candidates ranked by hybrid semantic score
            </p>
          </div>
        </div>

        {/* Candidate Cards */}
        <div className="flex flex-col gap-6">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="group flex flex-col p-6 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
            >
              {/* Top Row: Rank, Name, Score & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-5 border-b border-zinc-100">
                {/* Left Side: Rank & File Info */}
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 font-bold text-sm border border-zinc-200 shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-zinc-50 rounded-md border border-zinc-200">
                      <FileText className="w-4 h-4 text-zinc-500" />
                    </div>
                    <span className="text-base font-semibold text-zinc-900">
                      {result.filename}
                    </span>
                  </div>
                </div>

                {/* Right Side: Score & Delete Action */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
                      result.score >= 80
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : result.score >= 50
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {result.score >= 80 && <CheckCircle2 className="w-4 h-4" />}
                    {result.score}% Match
                  </div>

                  <button
                    onClick={() => handleDeleteCandidate(result.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Candidate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle Row: Gemini AI Summary */}
              <div className="mb-6 relative overflow-hidden bg-slate-50 p-5 rounded-xl border border-indigo-100/60 shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-blue-500 to-indigo-500"></div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-900 uppercase tracking-wider">
                    AI Insights
                  </span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed pl-1">
                  {result.ai_summary}
                </p>
              </div>

              {/* Bottom Row: Skills Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/50 p-4 rounded-lg border border-zinc-100">
                {/* Matched Skills */}
                <div>
                  <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    Matched Requirements
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills?.length > 0 ? (
                      result.matched_skills.map((skill) => (
                        <span
                          key={`matched-${skill}`}
                          className="px-2.5 py-1 bg-white text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200 shadow-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-400 italic">
                        No exact matches found.
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <span className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    Missing Requirements
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills?.length > 0 ? (
                      result.missing_skills.map((skill) => (
                        <span
                          key={`missing-${skill}`}
                          className="px-2.5 py-1 bg-white text-red-600 text-xs font-semibold rounded-md border border-red-200 shadow-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-zinc-400 italic">
                        All requested skills present!
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
