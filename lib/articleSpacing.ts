export const PARAGRAPH_SPACING_OPTIONS = [
  { value: "compact", label: "مضغوطة" },
  { value: "normal", label: "عادية" },
  { value: "relaxed", label: "مريحة" },
  { value: "spacious", label: "واسعة" },
] as const;

export type ParagraphSpacing = (typeof PARAGRAPH_SPACING_OPTIONS)[number]["value"];

export function normalizeSpacing(value: unknown): ParagraphSpacing {
  return PARAGRAPH_SPACING_OPTIONS.some((o) => o.value === value)
    ? (value as ParagraphSpacing)
    : "normal";
}
