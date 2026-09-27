const LEVELS = [
  {
    max: 30,
    name: "Broad",
    detail: "Leans on overall similarity between the resume and the description, so adjacent experience still scores well.",
  },
  {
    max: 69,
    name: "Balanced",
    detail: "Weighs the listed skills and the overall similarity about equally.",
  },
  {
    max: 100,
    name: "Strict",
    detail: "Rewards resumes that name the exact skills the description asks for.",
  },
];

export function describeStrictness(value) {
  return LEVELS.find((level) => value <= level.max) ?? LEVELS.at(-1);
}

export const STRICTNESS_PRESETS = [
  { name: "Broad", value: 20 },
  { name: "Balanced", value: 50 },
  { name: "Strict", value: 80 },
];
