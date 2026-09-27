import React, { useState } from "react";
import toast from "react-hot-toast";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import { Card, CardFooter, SettingRow } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { ThemeSegmented } from "../components/ui/ThemeToggle";
import Segmented from "../components/ui/Segmented";
import {
  getApiKey,
  getStrictness,
  looksLikeGeminiKey,
  setApiKey as storeApiKey,
  setStrictness as storeStrictness,
} from "../lib/settings";
import { STRICTNESS_PRESETS, describeStrictness } from "../lib/strictness";
import { getUser } from "../lib/session";
import useSignOut from "../lib/useSignOut";

export default function SettingsView() {
  return (
    <Page className="max-w-5xl">
      <PageHeader
        crumbs={[{ label: "Overview", to: "/" }, { label: "Settings" }]}
        title="Settings"
        description="Analysis preferences are stored in this browser and apply to every role."
      />

      <div className="space-y-5">
        <ApiKeyCard />
        <StrictnessCard />
        <Card>
          <SettingRow
            title="Appearance"
            description="Follows your system setting unless you choose one. Applies immediately."
          >
            <ThemeSegmented />
          </SettingRow>
        </Card>
        <AccountCard />
      </div>
    </Page>
  );
}

function ApiKeyCard() {
  const [saved, setSaved] = useState(getApiKey);
  const [value, setValue] = useState(saved);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  const dirty = value !== saved;

  const handleSave = () => {
    if (!looksLikeGeminiKey(value)) {
      setError("Gemini keys start with AIza. Check the value and try again.");
      return;
    }
    storeApiKey(value);
    setSaved(value);
    setError("");
    toast.success("API key saved");
  };

  const handleRemove = () => {
    storeApiKey("");
    setSaved("");
    setValue("");
    setError("");
    toast.success("API key removed");
  };

  return (
    <Card>
      <SettingRow
        title="Gemini API key"
        description="Used to write the short summary for each candidate. It is stored in this browser, sent with each analysis request and not saved on the server."
      >
        <Field
          label="API key"
          htmlFor="api-key"
          error={error}
          hint={
            saved
              ? `Saved key ends in ${saved.slice(-4)}.`
              : "No key saved. Resumes cannot be analysed until one is added."
          }
        >
          <div className="relative">
            <Input
              id="api-key"
              type={visible ? "text" : "password"}
              value={value}
              onChange={(event) => {
                setValue(event.target.value.trim());
                setError("");
              }}
              invalid={Boolean(error)}
              autoComplete="off"
              spellCheck="false"
              placeholder="AIza"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide key" : "Show key"}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center text-faint hover:text-ink hover:bg-hover"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
      </SettingRow>
      <CardFooter>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer noopener"
          className="link inline-flex items-center gap-1.5 t-sm"
        >
          Get a key from Google AI Studio
          <ExternalLink className="size-3.5" />
        </a>
        <div className="flex gap-2 justify-end">
          {saved && (
            <Button variant="danger" onClick={handleRemove}>
              Remove
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={!dirty || !value}>
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function StrictnessCard() {
  const [saved, setSaved] = useState(getStrictness);
  const [value, setValue] = useState(saved);
  const level = describeStrictness(value);

  const handleSave = () => {
    storeStrictness(value);
    setSaved(value);
    toast.success("Strictness saved");
  };

  return (
    <Card>
      <SettingRow
        title="Scoring strictness"
        description="Sets how a score is split between exact skill matches and overall similarity of the resume to the job description."
      >
        <Segmented
          label="Strictness preset"
          value={level.name}
          onChange={(name) =>
            setValue(STRICTNESS_PRESETS.find((preset) => preset.name === name).value)
          }
          options={STRICTNESS_PRESETS.map((preset) => ({ value: preset.name, label: preset.name }))}
        />

        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <label htmlFor="strictness" className="text-[14px] font-medium">
              Fine tune
            </label>
            <span className="inline-flex items-center h-6 px-2 rounded-full bg-fill text-[12px] font-medium tnum">{value}</span>
          </div>
          <input
            id="strictness"
            type="range"
            min="0"
            max="100"
            step="5"
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            aria-valuetext={`${value}, ${level.name}`}
            className="range-track mt-1"
            style={{ "--range-progress": `${value}%` }}
          />
        </div>

        <div className="mt-4 rounded-lg bg-sunken border border-line-soft p-3.5">
          <div className="flex h-2 gap-0.5" aria-hidden="true">
            {value > 0 && <div className="bg-accent rounded-full" style={{ flexGrow: value }} />}
            {value < 100 && (
              <div className="bg-line-strong rounded-full" style={{ flexGrow: 100 - value }} />
            )}
          </div>
          <dl className="grid grid-cols-2 mt-3">
            <div>
              <dt className="flex items-center gap-1.5 t-sm text-faint">
                <span className="w-3 h-2 rounded-[3px] bg-accent" aria-hidden="true" />
                Skill match
              </dt>
              <dd className="text-[18px] font-semibold tnum mt-0.5">{value}%</dd>
            </div>
            <div className="text-right">
              <dt className="flex items-center justify-end gap-1.5 t-sm text-faint">
                <span className="w-3 h-2 rounded-[3px] bg-line-strong" aria-hidden="true" />
                Overall similarity
              </dt>
              <dd className="text-[18px] font-semibold tnum mt-0.5">{100 - value}%</dd>
            </div>
          </dl>
        </div>

        <p className="t-sm text-muted mt-3">
          <span className="font-medium text-ink">{level.name}.</span> {level.detail}
        </p>
      </SettingRow>
      <CardFooter>
        <p className="t-sm text-faint">Applies to resumes analysed after saving.</p>
        <div className="flex gap-2 justify-end">
          {value !== saved && (
            <Button variant="ghost" onClick={() => setValue(saved)}>
              Reset
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} disabled={value === saved}>
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function AccountCard() {
  const handleLogout = useSignOut();
  const user = getUser();

  return (
    <Card>
      <SettingRow title="Account" description="The account this workplace belongs to.">
        <dl className="border border-line rounded-lg divide-y divide-line-soft t-sm overflow-hidden">
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] px-3 py-2.5">
            <dt className="text-faint">Name</dt>
            <dd className="truncate">{user?.name || "Not set"}</dd>
          </div>
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] px-3 py-2.5">
            <dt className="text-faint">Email</dt>
            <dd className="truncate">{user?.email || "Not set"}</dd>
          </div>
        </dl>
      </SettingRow>
      <CardFooter>
        <p className="t-sm text-faint">Signing out keeps your API key and preferences in this browser.</p>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
