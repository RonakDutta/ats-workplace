import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "../components/Logo";
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
    body: "Paste the job description. The skills it asks for become the yardstick every resume is measured against.",
  },
  {
    title: "Upload resumes",
    body: "Add as many PDF resumes as you have. Each one is scored on its own, so one bad file never stops the batch.",
  },
  {
    title: "Review the ranking",
    body: "Every candidate gets a score, the required skills they cover, the ones they lack and a short written summary.",
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
    try {
      const data = isLogin
        ? await loginUser(form.email, form.password)
        : await signupUser(form.name, form.email, form.password);

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
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <header className="shrink-0 h-12 flex items-center justify-between px-4 sm:px-6 border-b border-line bg-surface">
        <Logo />
        <ThemeMenu />
      </header>

      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-14 items-start">
          <div className="bg-surface border border-line rounded-md">
            <div className="px-6 pt-6 pb-2">
              <h1 className="t-title">{isLogin ? "Sign in" : "Create an account"}</h1>
              <p className="t-sm text-faint mt-1">
                {isLogin
                  ? "Use the email and password for your workplace."
                  : "Set up a workplace to start ranking resumes."}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="px-6 pt-4 pb-6 space-y-4">
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
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-xs flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
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

            <div className="px-6 py-3.5 border-t border-line bg-sunken rounded-b-md t-sm text-muted">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button type="button" onClick={switchMode} className="link">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>

          <article className="lg:pt-2">
            <p className="t-label">About</p>
            <h2 className="t-title mt-1.5">Rank a batch of resumes against one job description</h2>
            <p className="t-body text-muted mt-2 max-w-prose">
              ATS Workplace reads each resume, compares it with the role you describe and
              tells you who covers the requirements and what each person is missing.
            </p>

            <ol className="mt-6 border-t border-line">
              {STEPS.map(({ title, body }, index) => (
                <li key={title} className="grid grid-cols-[2rem_minmax(0,1fr)] py-4 border-b border-line">
                  <span className="font-mono t-sm text-faint tnum pt-px">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="t-body font-medium">{title}</p>
                    <p className="t-sm text-muted mt-0.5">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="t-xs text-faint mt-5 max-w-prose">
              Your Gemini API key is stored in this browser. It is sent along with each
              analysis request and is not saved on the server.
            </p>
          </article>
        </div>
      </main>
    </div>
  );
}
