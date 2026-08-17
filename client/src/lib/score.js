/**
 * A single definition of what a match score means, so the badge, the ring, the
 * table cell and the distribution chart never disagree with each other.
 */
export const SCORE_TIERS = [
  { id: "top", min: 80, label: "Strong match", tone: "good" },
  { id: "good", min: 60, label: "Possible match", tone: "warn" },
  { id: "poor", min: 0, label: "Weak match", tone: "bad" },
];

export function tierFor(score) {
  const value = Number(score) || 0;
  return SCORE_TIERS.find((tier) => value >= tier.min) ?? SCORE_TIERS.at(-1);
}

/**
 * Skill columns come straight off the database row. Depending on the column
 * type they arrive as an array or as JSON in a string, and a string would blow
 * up the `.map` that renders them, so normalise once at the edge.
 */
export function asSkillList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
}

/** Highest score first, so the list always matches what the header claims. */
export function byScoreDesc(a, b) {
  return (Number(b.score) || 0) - (Number(a.score) || 0);
}

export const TONE_CLASSES = {
  good: { text: "text-good", dot: "bg-good-mark", ring: "var(--good-mark)" },
  warn: { text: "text-warn", dot: "bg-warn-mark", ring: "var(--warn-mark)" },
  bad: { text: "text-bad", dot: "bg-bad-mark", ring: "var(--bad-mark)" },
};
