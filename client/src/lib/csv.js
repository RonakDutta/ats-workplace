import { asSkillList, tierFor } from "./score";

function cell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function candidatesToCsv(candidates) {
  const header = [
    "Rank",
    "Candidate",
    "Score",
    "Verdict",
    "Matched skills",
    "Missing skills",
    "Summary",
  ];

  const rows = candidates.map((candidate, index) => [
    index + 1,
    candidate.filename,
    candidate.score,
    tierFor(candidate.score).label,
    asSkillList(candidate.matched_skills).join("; "),
    asSkillList(candidate.missing_skills).join("; "),
    candidate.ai_summary ?? "",
  ]);

  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(filename, csv) {
  // The BOM keeps Excel from mangling non-ASCII names.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function slugify(text) {
  return (
    String(text ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "shortlist"
  );
}
