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
    body: "Paste the job description. Its requirements become the yardstick.",
  },
  {
    title: "Upload the batch",
    body: "Drop in as many resumes as you have. They are read together.",
  },
  {
    title: "Read the ranking",
    body: "Every candidate returns a score, matched skills and missing ones.",
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
      toast.success(
        isLogin ? `Welcome back, ${data.user.name}` : "Workplace ready",
      );
      navigate("/new");
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
    // The page itself scrolls, so nothing here can be centred out of reach on a
    // short viewport.
    <div className="min-h-dvh flex flex-col bg-canvas text-ink">
      <header className="shrink-0 flex items-center justify-between px-5 sm:px-8 h-16">
        <Logo />
        <ThemeMenu />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="t-title text-balance">
              {isLogin ? "Sign in to ATS Workplace" : "Create your workplace"}
            </h1>
            <p className="t-sm text-muted mt-2 max-w-sm mx-auto">
              Rank a whole batch of resumes against one job description, and see
              which required skills each candidate is missing.
            </p>
          </div>

          <div className="bg-surface border border-line rounded-xl p-6 sm:p-7 max-w-105 mx-auto">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {!isLogin && (
                <Field label="Full name" htmlFor="name" error={errors.name}>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
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
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  invalid={Boolean(errors.email)}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                error={errors.password}
              >
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    placeholder={
                      isLogin ? "Enter your password" : "Choose a password"
                    }
                    value={form.password}
                    onChange={handleChange}
                    invalid={Boolean(errors.password)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-xs flex items-center justify-center text-faint hover:text-ink hover:bg-sunken transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </Field>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full justify-center mt-1"
              >
                {isLogin ? "Sign in" : "Create workplace"}
              </Button>
            </form>

            <p className="t-sm text-muted mt-6 text-center">
              {isLogin ? "No workplace yet?" : "Already have a workplace?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="link rounded-xs"
              >
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Wider than the card on purpose, so three columns have room and the
              titles do not wrap. */}
          <ol className="grid gap-x-8 gap-y-5 sm:grid-cols-3 mt-9">
            {STEPS.map(({ title, body }, index) => (
              <li key={title}>
                <p className="t-sm font-medium">
                  <span className="text-ghost tnum mr-2">{index + 1}</span>
                  {title}
                </p>
                <p className="t-xs text-muted mt-1.5">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>

      <footer className="shrink-0 px-5 sm:px-8 py-5 text-center">
        <p className="t-xs text-ghost">
          Your API key stays in your browser and is never sent to our servers.
        </p>
      </footer>
    </div>
  );
}
