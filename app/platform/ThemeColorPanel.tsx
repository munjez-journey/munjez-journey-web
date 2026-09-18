"use client";

import { useEffect, useRef, useState } from "react";
import { PRESETS, findPresetByAccent, type ThemeName } from "./theme";

export default function ThemeColorPanel({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
}: {
  theme: ThemeName;
  accent: string;
  onThemeChange: (t: ThemeName) => void;
  onAccentChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [customHex, setCustomHex] = useState(accent);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomHex(accent);
  }, [accent]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current) return;
      const target = e.target as Node;
      if (!panelRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const selectedPreset = findPresetByAccent(accent);
  const dotBackground = selectedPreset?.sw || accent;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }} ref={panelRef}>
      <div className="theme-wrap">
        <button type="button" className={`thm${theme === "light" ? " active" : ""}`} onClick={() => onThemeChange("light")}>فاتح</button>
        <button type="button" className={`thm${theme === "dark" ? " active" : ""}`} onClick={() => onThemeChange("dark")}>غامق</button>
      </div>

      <button
        type="button"
        className="color-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <div className="cdot" style={{ background: dotBackground }} />
        <span>اللون</span>
        <span style={{ fontSize: "0.62rem", color: "var(--txt3)" }}>▾</span>
      </button>

      {open && (
        <div className="cpanel">
          <div className="cp-title">تخصيص اللون الرئيسي</div>
          <div className="pgrid">
            {PRESETS.map((p) => (
              <div key={p.a}>
                <div
                  className={`psw${p.a.toLowerCase() === accent.toLowerCase() ? " sel" : ""}`}
                  style={{ background: p.sw || p.a }}
                  title={p.n}
                  onClick={() => onAccentChange(p.a)}
                />
                <div className="plbl">{p.n}</div>
              </div>
            ))}
          </div>
          <div className="cp-div" />
          <div className="crow">
            <label>لون مخصّص</label>
            <input
              type="color"
              className="cinput"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
            />
            <span className="chex">{customHex}</span>
          </div>
          <button
            type="button"
            className="apply-btn"
            onClick={() => onAccentChange(customHex)}
          >
            تطبيق
          </button>
          <button
            type="button"
            className="reset-lnk"
            onClick={() => onAccentChange(PRESETS[0].a)}
          >
            إعادة الافتراضي
          </button>
        </div>
      )}
    </div>
  );
}
