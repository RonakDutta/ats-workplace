import React, { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import {
  Paperclip,
  FileText,
  Sparkle,
  X,
  ArrowRight,
  Save,
  Loader2,
} from "lucide-react";
import ResultsTable from "../features/analysis/ResultsTable";
import {
  analyzeCandidates,
  saveRoleDraft,
  getRoleById,
  updateRoleDraft,
} from "../services/api";

const RoleEditor = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setCandidates((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  useEffect(() => {
    const loadSavedData = async () => {
      if (!roleId) {
        setTitle("");
        setDescription("");
        setCandidates([]);
        setResults(null);
        return;
      }

      setIsPageLoading(true);

      setResults(null);

      // Only clear the dropzone if we didn't just come from the "Save Draft" button
      if (!location.state?.preserveDropzone) {
        setCandidates([]);
      }

      try {
        const data = await getRoleById(roleId);
        setTitle(data.role.title);
        setDescription(data.role.description);

        if (data.candidates && data.candidates.length > 0) {
          setResults(data.candidates);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadSavedData();
  }, [roleId]);

  const handleSaveDraft = async () => {
    if (!title || !description) {
      return toast.error("Please add a title and description first!");
    }

    setIsSaving(true);
    // Create a loading toast that we will dismiss when done
    const toastId = toast.loading("Saving draft...");

    try {
      if (roleId) {
        await updateRoleDraft(roleId, title, description);
        toast.success("Draft Updated Successfully!", { id: toastId });
      } else {
        const savedRole = await saveRoleDraft(title, description);
        navigate(`/role/${savedRole.id}`, {
          state: { preserveDropzone: true },
        });
        toast.success("New Draft Saved!", { id: toastId });
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!roleId) {
      return toast.error("Please Save Draft first to link candidates!");
    }

    setIsAnalyzing(true);
    const toastId = toast.loading(
      `Analyzing ${candidates.length} candidate(s)...`,
    );

    try {
      const apiKey = localStorage.getItem("gemini_api_key");
      const strictness = localStorage.getItem("ml_strictness") || 50;

      if (!apiKey)
        return toast.error("Please add your Gemini API Key in Settings first!");

      const data = await analyzeCandidates(
        description,
        candidates,
        roleId,
        apiKey,
        strictness,
      );

      // Merge new results with existing ones
      setResults((prev) => (prev ? [...data, ...prev] : data));
      setCandidates([]);

      toast.success("Analysis Complete!", { id: toastId });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Analysis failed. Check backend connection.", {
        id: toastId,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-zinc-200/80 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Role Profile"
            className="flex-1 min-w-0 text-2xl md:text-3xl font-extrabold text-zinc-900 placeholder-zinc-300 bg-transparent border-none focus:outline-none focus:ring-0 p-0 truncate transition-colors hover:text-zinc-700 focus:text-zinc-900"
          />

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 border-b-zinc-300 rounded-lg text-sm font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm active:translate-y-px focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              ) : (
                <Save className="w-4 h-4 text-zinc-400" />
              )}
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handleRunAnalysis}
              disabled={!description || candidates.length === 0 || isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-b from-zinc-800 to-zinc-950 text-white text-sm font-semibold rounded-lg hover:from-zinc-700 hover:to-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[inset_0px_1px_0px_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.4)] ring-1 ring-zinc-950 active:scale-[0.98] w-40 justify-center group focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  <span className="drop-shadow-sm">Run Engine</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {isPageLoading ? (
        // THE LOADING SCREEN
        <div className="max-w-7xl mx-auto px-6 py-32 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-zinc-500 font-medium animate-pulse">
            Loading workspace...
          </p>
        </div>
      ) : (
        <>
          {/* WORKSPACE */}
          <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Left Column: Job Description */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-8 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <FileText className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                    Job Description
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    Define the core requirements for the ML model
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col relative">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isAnalyzing}
                  placeholder="Paste the target job description here..."
                  className="flex-1 h-full w-full min-h-75 text-zinc-700 placeholder-zinc-400 bg-white border border-zinc-200 rounded-lg p-5 focus:outline-none focus:border-zinc-500 focus:ring-indigo-500/10 transition-all duration-300 resize-none text-base leading-relaxed shadow-inner disabled:opacity-50 disabled:bg-zinc-50 custom-scrollbar"
                />
              </div>
            </div>

            {/* Right Column: Candidates */}
            <div className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <Paperclip className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                    Applicant Intake
                  </h2>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {candidates.length} Profiles Selected
                  </p>
                </div>
              </div>

              <div
                {...getRootProps()}
                className={`px-6 py-10 border border-dashed rounded-lg transition-all duration-300 text-center flex-1 min-h-30 ${
                  isAnalyzing
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                } ${isDragActive ? "border-zinc-900 bg-zinc-950/5 scale-[1.02]" : "border-zinc-500 bg-white hover:border-zinc-700 hover:bg-zinc-50/50"}`}
              >
                <input {...getInputProps()} disabled={isAnalyzing} />
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                    <Paperclip
                      className={`w-5 h-5 transition-colors ${isDragActive ? "text-zinc-900" : "text-zinc-500"}`}
                    />
                  </div>
                  <p className="text-sm text-zinc-800 font-medium">
                    {isDragActive ? "Drop files now" : "Attach PDF profiles"}
                  </p>
                  <p className="text-xs text-zinc-500 leading-normal max-w-45 mx-auto">
                    Support for batch upload of anonymized or standard resumes
                    (max 10MB)
                  </p>
                </div>
              </div>

              {candidates.length > 0 && (
                <div className="mt-8 flex flex-col gap-2.5 max-h-62.5 overflow-y-auto pr-2 custom-scrollbar">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
                    Candidate Batch
                  </h3>
                  {candidates.map((file) => (
                    <div
                      key={file.name}
                      className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-zinc-200 rounded-md shadow-sm hover:border-zinc-300 group transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="text-sm text-zinc-700 font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0 border border-zinc-200">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        onClick={() => removeCandidate(file.name)}
                        disabled={isAnalyzing}
                        className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all disabled:hidden shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Render the extracted component here! */}
          <ResultsTable results={results} setResults={setResults} />
        </>
      )}
    </div>
  );
};

export default RoleEditor;
