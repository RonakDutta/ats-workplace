import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";
import BloomArt from "../components/BloomArt";
import { ScoreMeter, VerdictTag } from "../components/ui/Score";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { ThemeMenu } from "../components/ui/ThemeToggle";
import { loginUser, signupUser } from "../services/api";
import { setSession } from "../lib/session";

const EMPTY = { name: "", email: "", password: "" };

// The API sets no password policy, so the only rule enforced here is one that
// cannot lock an existing account out of its own workplace.
const MIN_NEW_PASSWORD = 6;

const STEPS = [
  {
    title: "Describe the role",
    body: "Paste the job description. Its skills become the yardstick.",
  },
  {
    title: "Upload resumes",
    body: "Drop in PDFs. Each one is scored on its own.",
  },
  {
    title: "Review the ranking",
    body: "See scores, missing skills and a short summary.",
  },
];

export default function AuthView() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const validate = () => {
    const next = {};
    if (!isLogin && form.name.trim().length < 2) {
      next.name = "Enter your full name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (!form.password) {
      next.password = "Enter your password.";
    } else if (!isLogin && form.password.length < MIN_NEW_PASSWORD) {
      next.password = `Use at least ${MIN_NEW_PASSWORD} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const cleanEmail = form.email.trim().toLowerCase();
    try {
      const data = isLogin
        ? await loginUser(cleanEmail, form.password)
        : await signupUser(form.name.trim(), cleanEmail, form.password);

      setSession(data.token, data.user);
      toast.success(isLogin ? `Signed in as ${data.user.name}` : "Account created");
      navigate(isLogin ? "/" : "/new");
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          "We could not sign you in. Check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? "signup" : "login");
    setErrors({});
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] bg-canvas text-ink">
      <div className="flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center justify-between px-5 sm:px-8">
          <Logo />
          <ThemeMenu />
        </header>

        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden relative h-40 mb-8 rounded-2xl overflow-hidden border border-line-soft bg-[var(--art-bg)]">
              <BloomArt className="absolute left-1/2 -translate-x-1/2 -top-8 w-[260px]" />
            </div>

            <h1 className="text-[28px] font-semibold tracking-[-0.025em] leading-tight">
              {isLogin ? "Welcome back" : "Create your workplace"}
            </h1>
            <p className="t-body text-faint mt-1.5">
              {isLogin
                ? "Sign in to rank resumes against your open roles."
                : "Set up an account to start ranking resumes."}
            </p>

            <div className="mt-7 bg-surface border border-line rounded-xl shadow-sm p-6">
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {!isLogin && (
                    <Field label="Full name" htmlFor="name" error={errors.name}>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange}
                        invalid={Boolean(errors.name)}
                      />
                    </Field>
                  )}

                  <Field label="Email" htmlFor="email" error={errors.email}>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      invalid={Boolean(errors.email)}
                    />
                  </Field>

                  <Field
                    label="Password"
                    htmlFor="password"
                    error={errors.password}
                    hint={isLogin ? undefined : `At least ${MIN_NEW_PASSWORD} characters.`}
                  >
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={form.password}
                        onChange={handleChange}
                        invalid={Boolean(errors.password)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </Field>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full justify-center"
                  >
                    {isSubmitting
                      ? isLogin
                        ? "Signing in"
                        : "Creating account"
                      : isLogin
                        ? "Sign in"
                        : "Create account"}
                  </Button>
                </form>
            </div>

            <p className="t-body text-faint mt-6 text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={switchMode} className="link">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </main>

        <footer className="shrink-0 px-5 sm:px-8 py-5">
          <p className="t-sm text-ghost max-w-md">
            Your Gemini API key is stored in this browser. It is sent with each analysis
            request and is not saved on the server.
          </p>
        </footer>
      </div>

      <aside className="hidden lg:flex p-3">
        <div className="relative flex-1 flex flex-col justify-end overflow-hidden rounded-2xl border border-line-soft bg-[var(--art-bg)] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,var(--art-line)_39px,var(--art-line)_40px)]">
          <BloomArt className="absolute -right-10 -top-6 h-[82%] max-h-[720px]" />

          <SampleRanking />

          <div className="relative m-4 rounded-xl bg-surface/85 backdrop-blur-sm border border-line shadow-sm p-6">
            <h2 className="text-[18px] font-semibold tracking-[-0.015em]">
              Rank a batch of resumes against one job description
            </h2>
            <ol className="grid grid-cols-3 gap-5 mt-5">
              {STEPS.map(({ title, body }, index) => (
                <li key={title}>
                  <span className="inline-flex items-center justify-center size-6 rounded-md bg-accent text-white text-[12px] font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-[14px] font-medium mt-2.5">{title}</p>
                  <p className="t-sm text-faint mt-1">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}

const SAMPLE = [
  { name: "priya_sharma.pdf", score: 88 },
  { name: "marcus_lee.pdf", score: 71 },
  { name: "a_okafor.pdf", score: 54 },
];

/** A small, static preview of the ranking table floating over the artwork. */
function SampleRanking() {
  return (
    <div className="absolute left-8 top-10 w-[340px] rounded-xl bg-surface border border-line shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 h-11 border-b border-line-soft">
        <p className="text-[13px] font-semibold">Senior Frontend Engineer</p>
        <span className="inline-flex items-center h-5 px-2 rounded-full bg-fill text-[11px] font-medium text-muted">
          3 ranked
        </span>
      </div>
      <ul className="divide-y divide-line-soft">
        {SAMPLE.map((row, index) => (
          <li key={row.name} className="flex items-center gap-3 px-4 h-11">
            <span className="text-[12px] text-faint tnum w-3">{index + 1}</span>
            <span className="text-[13px] font-medium truncate flex-1">{row.name}</span>
            <ScoreMeter score={row.score} width="w-10" />
            <VerdictTag score={row.score} />
          </li>
        ))}
      </ul>
    </div>
  );
}
