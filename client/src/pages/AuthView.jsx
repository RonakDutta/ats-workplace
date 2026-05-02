import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, Check } from "lucide-react";
import toast from "react-hot-toast";
import { loginUser, signupUser } from "../services/api";

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await loginUser(formData.email, formData.password);
        toast.success(`Welcome back, ${data.user.name}!`);
      } else {
        data = await signupUser(
          formData.name,
          formData.email,
          formData.password,
        );
        toast.success("Workspace created successfully!");
      }

      localStorage.setItem("ats_token", data.token);
      localStorage.setItem("ats_user", JSON.stringify(data.user));
      navigate("/new");
    } catch (error) {
      toast.error(error.response?.data?.error || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-zinc-900 selection:bg-zinc-200">
      {/* LEFT PANE: EDITORIAL BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 text-zinc-50 flex-col justify-between p-16">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-24">
            <div className="w-8 h-8 bg-white text-zinc-950 rounded flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              ATS Workspace
            </span>
          </div>

          <h1 className="text-5xl font-semibold tracking-tight leading-[1.15] mb-6 max-w-lg">
            A smarter way to build your talent pipeline.
          </h1>
          <p className="text-lg text-zinc-400 max-w-md leading-relaxed font-medium">
            Process documents instantly, visualize skill gaps, and match
            candidates with semantic context.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <FeatureItem text="Secure, isolated databases" />
          <FeatureItem text="Customizable ML matching engines" />
          <FeatureItem text="Real-time analytics dashboard" />
        </div>
      </div>

      {/* RIGHT PANE: DOCUMENT-STYLE FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-95">
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
              {isLogin ? "Sign in" : "Create account"}
            </h2>
            <p className="text-base text-zinc-500">
              {isLogin
                ? "Enter your email to access your workspace."
                : "Set up your secure environment instantly."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all sm:text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Email
              </label>
              <input
                required
                type="email"
                name="email"
                placeholder="Enter your email"
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-transparent border border-zinc-300 rounded-md placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all sm:text-sm"
              />
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md font-medium transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 text-sm"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? "Continue with Email" : "Create Workspace"}
            </button>
          </form>

          <div className="mt-8 pt-8 flex items-center justify-start">
            <p className="text-sm text-zinc-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-zinc-900 font-medium hover:underline decoration-zinc-300 underline-offset-4 transition-all"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Minimalist feature item
const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3 text-zinc-400">
    <Check className="w-4 h-4 text-zinc-500" />
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default AuthView;
