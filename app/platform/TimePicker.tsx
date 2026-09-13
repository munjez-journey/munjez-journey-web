"use client";

// أداة اختيار الوقت (ساعة 1-12 + دقيقة + AM/PM)، منقولة سلوكياً من
// public/munjez-platform.html (makeTp/activateTp/syncTp/clearTp)، بقيمة
// مخزَّنة بصيغة 24 ساعة "HH:MM" كما هو متوقع في جدول tasks (from_time/to_time).

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function to24Hour(h12: number, period: "AM" | "PM") {
  let h24 = h12;
  if (period === "PM" && h24 !== 12) h24 += 12;
  if (period === "AM" && h24 === 12) h24 = 0;
  return h24;
}

export default function TimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  if (!value) {
    return (
      <button type="button" className="tp-empty" onClick={() => onChange("08:00")}>
        + اختر الوقت
      </button>
    );
  }

  const [hh, mm] = value.split(":");
  const n = Number(hh);
  const period: "AM" | "PM" = n >= 12 ? "PM" : "AM";
  const h12 = n % 12 || 12;
  const minute = mm || "00";

  function update(newH12: number, newMinute: string, newPeriod: "AM" | "PM") {
    const h24 = to24Hour(newH12, newPeriod);
    onChange(`${String(h24).padStart(2, "0")}:${newMinute}`);
  }

  return (
    <div className="tp-wrap">
      <select className="tp-sel" value={h12} onChange={(e) => update(Number(e.target.value), minute, period)}>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="tp-sep">:</span>
      <select className="tp-sel" value={minute} onChange={(e) => update(h12, e.target.value, period)}>
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select className="tp-sel" style={{ maxWidth: 50 }} value={period} onChange={(e) => update(h12, minute, e.target.value as "AM" | "PM")}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
      <button type="button" className="tp-clr" onClick={() => onChange("")} aria-label="مسح الوقت">×</button>
    </div>
  );
}
