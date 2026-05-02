import React, { useState, useEffect } from "react";
import { Key, Sliders, Save, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const SettingsView = () => {
  const [apiKey, setApiKey] = useState("");
  const [strictness, setStrictness] = useState(50);

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    const savedStrictness = localStorage.getItem("ml_strictness");
    if (savedKey) setApiKey(savedKey);
    if (savedStrictness) setStrictness(parseInt(savedStrictness));
  }, []);

  const handleSave = () => {
    if (!apiKey.startsWith("AIza")) {
      return toast.error("Please enter a valid Google Gemini API Key.");
    }
    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("ml_strictness", strictness);
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            System Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your API integrations and AI engine preferences.
          </p>
        </div>

        {/* SETTINGS CONTAINER */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* API KEY SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-8 border-b border-zinc-100">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 text-base font-semibold text-zinc-900 mb-1.5">
                <Key className="w-4 h-4 text-indigo-500" /> API Configuration
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Connect your Google Gemini API key to power the AI analysis
                engine. Your key is stored securely in your browser's local
                storage.
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm shadow-sm"
              />

              {/* Always render the paragraph to reserve space, relying on opacity to hide/show it */}
              <p
                className={`flex items-center gap-1.5 text-xs font-medium text-emerald-600 mt-3 transition-opacity duration-200
      ${apiKey.startsWith("AIza") ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <ShieldCheck className="w-4 h-4" /> Valid key format detected
              </p>
            </div>
          </div>

          {/* ML SLIDER SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 p-6 md:p-8 gap-8 border-b border-zinc-100 bg-zinc-50/30">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 text-base font-semibold text-zinc-900 mb-1.5">
                <Sliders className="w-4 h-4 text-emerald-500" /> Engine
                Strictness
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Adjust how the AI weighs exact keyword matches versus semantic
                context. Currently operating at{" "}
                <strong className="text-zinc-900">
                  {strictness}% Strictness
                </strong>
                .
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col justify-center">
              <div className="w-full pt-4 pb-2">
                {/* THE UPGRADED SLIDER */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10" // 👈 This makes it jump in 10% blocks instead of 1%
                  value={strictness}
                  onChange={(e) => setStrictness(e.target.value)}
                  className="w-full h-2.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                />

                {/* DYNAMIC LABELS */}
                <div className="flex justify-between text-[11px] font-bold text-zinc-400 mt-4 uppercase tracking-wider">
                  <span
                    className={`transition-colors ${strictness <= 30 ? "text-indigo-600" : ""}`}
                  >
                    Broad (Semantic)
                  </span>
                  <span
                    className={`transition-colors ${strictness > 30 && strictness < 70 ? "text-indigo-600" : ""}`}
                  >
                    Balanced
                  </span>
                  <span
                    className={`transition-colors ${strictness >= 70 ? "text-indigo-600" : ""}`}
                  >
                    Strict (Keywords)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION FOOTER */}
          <div className="p-6 md:p-8 bg-zinc-50 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
