import React, { useState } from "react";
import toast from "react-hot-toast";
import { Check, ExternalLink } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { ThemeSegmented } from "../components/ui/ThemeToggle";
import { cn } from "../lib/cn";

const STRICTNESS_LABELS = [
  { max: 30, name: "Broad", detail: "Leans on semantic similarity. Surfaces adjacent experience." },
  { max: 69, name: "Balanced", detail: "Weighs stated skills and context about equally." },
  { max: 100, name: "Strict", detail: "Rewards exact keyword matches from the description." },
];

function describeStrictness(value) {
  return STRICTNESS_LABELS.find((entry) => value <= entry.max);
}

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsView() {
  const [apiKey, setApiKey] = useState(() => readStored("gemini_api_key", ""));
  const [strictness, setStrictness] = useState(() =>
    Number(readStored("ml_strictness", 50)),
  );
  const [error, setError] = useState("");

  const keyLooksValid = apiKey.startsWith("AIza") && apiKey.length > 20;
  const mode = describeStrictness(strictness);

  const handleSave = () => {
    if (!keyLooksValid) {
      setError("Gemini keys start with AIza. Check the value and try again.");
      return;
    }
    setError("");
    localStorage.setItem("gemini_api_key", apiKey);
    localStorage.setItem("ml_strictness", String(strictness));
    toast.success("Settings saved");
  };

  return (
    <Page className="max-w-4xl">
      <PageHeader
        title="Settings"
        description="Your key and engine preferences live in this browser only."
      />

      <div className="mt-7 space-y-4">
        <Card>
          <Section
            title="Gemini API key"
            description="Powers the resume analysis. It is kept in local storage and sent straight to Google, never to our servers."
            aside={
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer noopener"
                className="link inline-flex items-center gap-1.5 t-sm rounded-xs mt-3"
              >
                Get a key
                <ExternalLink className="size-3.5" />
              </a>
            }
          >
            <Field
              htmlFor="api-key"
              error={error}
              hint={
                keyLooksValid && !error ? undefined : "Starts with AIza."
              }
            >
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setError("");
                }}
                invalid={Boolean(error)}
                autoComplete="off"
                spellCheck="false"
                placeholder="AIzaSy..."
                className="font-mono bg-surface"
              />
            </Field>
            <p
              className={cn(
                "flex items-center gap-1.5 t-xs text-good mt-2 transition-opacity duration-150",
                keyLooksValid && !error ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!keyLooksValid}
            >
              <Check className="size-3.5" />
              Key format looks right
            </p>
          </Section>
        </Card>

        <Card>
          <Section
            title="Engine strictness"
            description="Controls how much the engine rewards exact keyword matches over related experience."
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className="t-body font-medium">{mode.name}</span>
              <span className="t-sm text-faint tnum">{strictness}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={strictness}
              onChange={(event) => setStrictness(Number(event.target.value))}
              aria-label="Engine strictness"
              aria-valuetext={`${strictness} percent, ${mode.name}`}
              className="range-track"
              style={{ ["--range-progress"]: `${strictness}%` }}
            />

            <div className="flex justify-between t-xs text-ghost mt-1.5">
              <span>Broad</span>
              <span>Balanced</span>
              <span>Strict</span>
            </div>

            <p className="t-sm text-muted mt-4 max-w-prose">
              {mode.detail}
            </p>
          </Section>
        </Card>

        <Card>
          <Section
            title="Appearance"
            description="Follows your system setting unless you pick one."
          >
            <ThemeSegmented />
          </Section>
        </Card>

        <div className="flex justify-end">
          <Button variant="primary" size="lg" onClick={handleSave}>
            Save settings
          </Button>
        </div>
      </div>
    </Page>
  );
}

function Section({ title, description, aside, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10 p-6 md:p-7">
      <div className="md:col-span-2">
        <h2 className="t-heading">{title}</h2>
        <p className="t-sm text-muted mt-2">
          {description}
        </p>
        {aside}
      </div>
      <div className="md:col-span-3 min-w-0">{children}</div>
    </div>
  );
}
