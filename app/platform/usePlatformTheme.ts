"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { THEMES, PRESETS, computeAccentVars, findPresetByAccent, customPreset, type ThemeName } from "./theme";

const THEME_KEY = "mj_platform_theme";
const ACCENT_KEY = "mj_platform_accent";

function readStorage(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // تجاهل: قد يكون التخزين المحلي معطّلاً (وضع خاص مثلاً) — لا يعطّل الصفحة.
  }
}

export function usePlatformTheme() {
  const [theme, setThemeState] = useState<ThemeName>("light");
  const [accent, setAccentState] = useState<string>(PRESETS[0].a);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedTheme = readStorage(THEME_KEY, "light") as ThemeName;
    const storedAccent = readStorage(ACCENT_KEY, PRESETS[0].a);
    setThemeState(storedTheme === "dark" ? "dark" : "light");
    setAccentState(storedAccent);
    setHydrated(true);
  }, []);

  function setTheme(next: ThemeName) {
    setThemeState(next);
    writeStorage(THEME_KEY, next);
  }

  function setAccent(next: string) {
    setAccentState(next);
    writeStorage(ACCENT_KEY, next);
  }

  const style = useMemo<CSSProperties>(() => {
    const preset = findPresetByAccent(accent) || customPreset(accent);
    const accentVars = computeAccentVars(preset, theme);
    return {
      ...THEMES[theme],
      ...accentVars,
    } as CSSProperties;
  }, [theme, accent]);

  return {
    theme,
    accent,
    setTheme,
    setAccent,
    style,
    hydrated,
  };
}
