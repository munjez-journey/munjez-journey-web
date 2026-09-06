"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionFromType(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("الرجاء اختيار صورة بصيغة jpg أو png أو webp فقط.");
      return;
    }

    setError("");
    setUploading(true);

    const supabase = createClient();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionFromType(
      file.type
    )}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError("تعذّر رفع الصورة، حاول مرة أخرى.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="معاينة الصورة" className="h-40 w-full object-cover" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border border-border px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          {uploading ? "جارٍ الرفع..." : value ? "استبدال الصورة" : "رفع صورة"}
        </button>

        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-destructive transition-opacity hover:opacity-70"
          >
            إزالة الصورة
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
