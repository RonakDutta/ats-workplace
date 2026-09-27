import { useEffect, useState } from "react";

/**
 * SVG presentation attributes cannot resolve var(), and Recharts passes colours
 * through as attributes. So the chart colours are read out of the same CSS
 * custom properties the rest of the interface uses, and re-read whenever the
 * theme class on <html> changes. One source of truth, no duplicated hex.
 */
const ROLES = {
  accent: "--chart-accent",
  grid: "--chart-grid",
  axis: "--chart-axis",
  surface: "--surface",
  hover: "--hover",
  muted: "--muted",
  good: "--good-mark",
  warn: "--warn-mark",
  bad: "--bad-mark",
};

function read() {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(ROLES).map(([key, prop]) => [
      key,
      styles.getPropertyValue(prop).trim(),
    ]),
  );
}

export default function useChartTheme() {
  const [colors, setColors] = useState(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
