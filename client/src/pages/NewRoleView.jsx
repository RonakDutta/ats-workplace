import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader, { Page } from "../components/PageHeader";
import FileQueue, { DropArea } from "../components/FileQueue";
import Button from "../components/ui/Button";
import ProgressBar from "../components/ui/ProgressBar";
import { Card, CardFooter, SettingRow } from "../components/ui/Card";
import { Field, Input, Textarea } from "../components/ui/Field";
import { createRole } from "../services/api";
import { announceRolesChanged } from "../lib/session";
import { analyzeFiles } from "../lib/analysis";
import { plural } from "../lib/format";
import usePdfDropzone from "../lib/usePdfDropzone";

/**
 * Creating the role and analysing the first batch are one action. Resumes are
 * optional so a role can still be set up ahead of time.
 */
export default function NewRoleView() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(null);
  const navigate = useNavigate();

  const busy = stage !== null;
  const { getRootProps, getInputProps, isDragActive, open } = usePdfDropzone(setFiles, {
    disabled: busy,
  });

  const words = description.trim() ? description.trim().split(/\s+/).length : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = {};
    if (!title.trim()) next.title = "Give the role a name.";
    if (!description.trim()) next.description = "Paste the job description.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStage("creating");
    let role;
    try {
      role = await createRole(title.trim(), description.trim());
      announceRolesChanged();
    } catch {
      toast.error("Could not create the role");
      setStage(null);
      return;
    }

    if (files.length === 0) {
      toast.success("Role created");
      navigate(`/role/${role.id}`);
      return;
    }

    setStage("analysing");
    const outcome = await analyzeFiles({
      roleId: role.id,
      description: description.trim(),
      files,
      onProgress: setProgress,
    });

    if (outcome === null) {
      toast.error("Role created. Add your Gemini API key in Settings to analyse resumes.", {
        duration: 6000,
      });
      navigate("/settings");
      return;
    }

    if (outcome.analysed === 0) {
      toast.error(
        "Role created, but no resumes could be analysed. Check your API key and that the files are readable PDFs.",
        { duration: 6000 },
      );
    } else if (outcome.failed.length > 0) {
      toast(`${outcome.analysed} analysed. ${outcome.failed.length} could not be read.`, {
        duration: 6000,
      });
    } else {
      toast.success(`${plural(outcome.analysed, "resume")} analysed`);
    }
    navigate(`/role/${role.id}`);
  };

  const submitLabel =
    stage === "creating"
      ? "Creating role"
      : stage === "analysing"
        ? "Analysing resumes"
        : files.length > 0
          ? `Create and analyse ${plural(files.length, "resume")}`
          : "Create role";

  return (
    <div {...getRootProps()} className="focus:outline-none">
      <input {...getInputProps()} />

      <Page className="max-w-4xl">
        <PageHeader
          crumbs={[{ label: "Overview", to: "/" }, { label: "New role" }]}
          title="New role"
          description="Describe the position and, if you have them, add the first resumes to rank."
        />

        <form onSubmit={handleSubmit} noValidate>
          <Card className="divide-y divide-line-soft">
            <SettingRow
              title="Role details"
              description="The name is how the role appears in the sidebar. The description is what every resume is scored against."
            >
              <div className="space-y-4">
                <Field label="Role name" htmlFor="title" error={errors.title}>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    invalid={Boolean(errors.title)}
                    placeholder="Senior Frontend Engineer"
                    disabled={busy}
                  />
                </Field>
                <Field
                  label="Job description"
                  htmlFor="description"
                  error={errors.description}
                  hint={words ? plural(words, "word") : "Include responsibilities and required skills."}
                >
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    invalid={Boolean(errors.description)}
                    className="min-h-60"
                    disabled={busy}
                  />
                </Field>
              </div>
            </SettingRow>

            <SettingRow
              title="Resumes"
              description="Optional. You can also add resumes later from the role page, or drop them anywhere on this page."
            >
              <div className="space-y-3">
                <DropArea isDragActive={isDragActive} onBrowse={open} disabled={busy} />
                <FileQueue
                  files={files}
                  disabled={busy}
                  onRemove={(file) =>
                    setFiles((prev) => prev.filter((item) => item.name !== file.name))
                  }
                />
                {stage === "analysing" && progress && (
                  <ProgressBar
                    done={progress.done}
                    total={progress.total}
                    label={`Analysing ${progress.file.name}`}
                  />
                )}
              </div>
            </SettingRow>

            <CardFooter>
              <p className="t-sm text-faint">
                Analysis uses the Gemini key and strictness saved in Settings.
              </p>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={busy}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={busy}>
                  {submitLabel}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Page>
    </div>
  );
}
