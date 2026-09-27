import { analyzeResume } from "../services/api";
import { getApiKey, getStrictness } from "./settings";

/**
 * Scores resumes one request at a time. The endpoint only answers once a whole
 * batch is done, so going file by file is what makes real progress reporting
 * possible, and one unreadable PDF cannot take the rest of the batch with it.
 *
 * Returns `null` when no API key is configured, so the caller can route the
 * user to Settings.
 */
export async function analyzeFiles({ roleId, description, files, onProgress, onResult }) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const strictness = getStrictness();
  const failed = [];
  let analysed = 0;

  for (const [index, file] of files.entries()) {
    onProgress?.({ done: index, total: files.length, file });
    try {
      const rows = await analyzeResume({ description, file, roleId, apiKey, strictness });
      if (rows.length === 0) {
        failed.push(file);
        continue;
      }
      analysed += rows.length;
      onResult?.(rows, file);
    } catch {
      failed.push(file);
    }
  }

  return { analysed, failed };
}
