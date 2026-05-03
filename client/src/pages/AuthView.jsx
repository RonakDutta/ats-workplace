import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, Check, EyeOff, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { loginUser, signupUser } from "../services/api";

const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-dvh flex bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200">
      {/* LEFT PANE */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 text-zinc-50 flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-24">
            <div className="w-10 h-10 bg-white text-zinc-950 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ATS Workspace
            </span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-[1.15] mb-6 max-w-lg text-transparent bg-clip-text bg-linear-to-br from-white to-zinc-400">
            A smarter way to build your talent pipeline.
          </h1>
          <p className="text-lg text-zinc-400 max-w-md leading-relaxed font-medium">
            Process documents instantly, visualize skill gaps, and match
            candidates with semantic context.
          </p>
        </div>

        <div className="relative z-10 space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm max-w-md">
          <FeatureItem text="Secure, isolated databases" />
          <FeatureItem text="Customizable ML matching engines" />
          <FeatureItem text="Real-time analytics dashboard" />
        </div>
      </div>

      {/* RIGHT PANE */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 py-12 sm:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-zinc-200/50 rounded-full blur-3xl -mr-20 -mt-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-zinc-200/50 rounded-full blur-3xl -ml-20 -mb-10 pointer-events-none" />

        <div className="w-full max-w-sm mx-auto sm:max-w-md relative z-10">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-zinc-950 text-white rounded-xl flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
              ATS Workspace
            </span>
          </div>

          {/* Form Card Container */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100">
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>
              <p className="text-sm text-zinc-500 font-medium">
                {isLogin
                  ? "Enter your credentials to access your workspace."
                  : "Set up your secure environment instantly."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1.5 pl-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all text-sm font-medium text-zinc-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5 pl-1">
                  Email
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all text-sm font-medium text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5 pl-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-11 bg-zinc-50/50 border border-zinc-200 rounded-xl placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all text-sm font-medium text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-200 bg-transparent"
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold transition-all active:scale-[0.98] shadow-md shadow-zinc-900/10 flex items-center justify-center gap-2 mt-4 text-sm"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Sign in to workspace" : "Create workspace"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center">
              <p className="text-sm font-medium text-zinc-500">
                {isLogin ? "New to ATS Workspace?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-zinc-900  hover:underline underline-offset-4 transition-all"
                >
                  {isLogin ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <div className="flex items-center gap-3 text-zinc-300">
    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
      <Check className="w-3 h-3 text-white" />
    </div>
    <span className="text-sm font-medium">{text}</span>
  </div>
);

export default AuthView;
