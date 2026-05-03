import React, { useState, useEffect } from "react";
import { Search, FileText, Briefcase, Award, Loader2 } from "lucide-react";
import { fetchAllCandidates } from "../services/api";

const CandidatesView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const data = await fetchAllCandidates();
        setCandidates(data);
      } catch (error) {
        console.error("Failed to load metrics");
      } finally {
        setIsLoading(false);
      }
    };
    loadCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = c.filename.toLowerCase().includes(query);
    const roleMatch = c.role_title.toLowerCase().includes(query);

    const skillsMatch =
      c.matched_skills &&
      c.matched_skills.some((skill) => skill.toLowerCase().includes(query));

    return nameMatch || roleMatch || skillsMatch;
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl h-screen mx-auto px-6 py-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">
          Loading all candidates...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="pt-12 lg:pt-0">
            <h1 className="text-3xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Talent Pool
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Search across all {candidates.length} processed resumes.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          {/* MOBILE VIEW  */}
          <div className="md:hidden flex flex-col divide-y divide-zinc-200">
            {filteredCandidates.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500 text-sm">
                No candidates found
                {searchQuery.length === 0 ? "" : ` matching "${searchQuery}"`}
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-5 flex flex-col gap-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="border-b pb-4 border-zinc-100 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200 shrink-0">
                        <FileText className="w-4 h-4 text-zinc-500" />
                      </div>
                      <span className="font-medium text-zinc-900 truncate">
                        {candidate.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">
                      <Award
                        className={`w-3.5 h-3.5 ${candidate.score > 75 ? "text-emerald-500" : "text-amber-500"}`}
                      />
                      <span className="font-bold text-zinc-900 text-sm">
                        {candidate.score}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-600 text-sm">
                    <Briefcase className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{candidate.role_title}</span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {candidate.matched_skills?.slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.matched_skills?.length > 4 && (
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded text-[11px] font-medium">
                        +{candidate.matched_skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP VIEW  */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-500">
                    Candidate
                  </th>
                  <th className="px-6 py-4 font-semibold text-zinc-500">
                    Applied Role
                  </th>
                  <th className="px-6 py-4 font-semibold text-zinc-500">
                    Match Score
                  </th>
                  <th className="px-6 py-4 font-semibold text-zinc-500">
                    Top Skills
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-zinc-500"
                    >
                      No candidates found
                      {searchQuery.length === 0
                        ? ""
                        : ` matching "${searchQuery}"`}
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-zinc-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-md border border-zinc-200">
                            <FileText className="w-4 h-4 text-zinc-500" />
                          </div>
                          <span className="font-medium text-zinc-900">
                            {candidate.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Briefcase className="w-4 h-4 text-zinc-400" />
                          {candidate.role_title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Award
                            className={`w-4 h-4 ${candidate.score > 75 ? "text-emerald-500" : "text-amber-500"}`}
                          />
                          <span className="font-bold text-zinc-900">
                            {candidate.score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap max-w-xs">
                          {candidate.matched_skills
                            ?.slice(0, 3)
                            .map((skill, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          {candidate.matched_skills?.length > 3 && (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded text-xs font-medium">
                              +{candidate.matched_skills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatesView;
