"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PODCAST_AUDIO_LIMIT_LABEL,
  PodcastAudioUploadError,
  audioFileNameFromUrl,
  formatFileSize,
  isStoredPodcastAudio,
  uploadPodcastAudio,
  validatePodcastAudioFile,
} from "@/lib/podcastAudio";

type Mode = "upload" | "link";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string; fileSize: number; progress: number }
  | { status: "done"; fileName: string; fileSize: number };

const modeButton = (active: boolean) =>
  active
    ? "bg-foreground px-4 py-2 text-sm text-background"
    : "px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-70";

/**
 * حقل صوت الحلقة: إما ملف MP3 يُرفع إلى Storage، أو رابط خارجي — واحد منهما فقط.
 * value هو ما سيُحفظ في audio_url. الحذف الفعلي لأي ملف قديم أو غير مستخدم
 * يتم في SectionForm بعد نجاح الحفظ (أو عند المغادرة دون حفظ)، وليس هنا.
 */
export default function AudioUpload({
  value,
  onChange,
  onUploaded,
  onBusyChange,
}: {
  value: string;
  onChange: (url: string) => void;
  onUploaded: (url: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [initialUrl] = useState(value);
  const initialIsStored = isStoredPodcastAudio(initialUrl);
  const [mode, setMode] = useState<Mode>(initialUrl && !initialIsStored ? "link" : "upload");
  const [uploadUrl, setUploadUrl] = useState(initialIsStored ? initialUrl : "");
  const [linkUrl, setLinkUrl] = useState(initialIsStored ? "" : initialUrl);
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  // مغادرة الصفحة أثناء الرفع: نوقف الطلب
  useEffect(() => () => abortRef.current?.(), []);

  const uploading = upload.status === "uploading";

  function selectMode(next: Mode) {
    if (uploading || next === mode) return;
    setMode(next);
    setError("");
    onChange(next === "upload" ? uploadUrl : linkUrl);
  }

  async function handleFile(file: File) {
    if (uploading) return;
    setError("");

    const problem = await validatePodcastAudioFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    const previous = upload;
    setUpload({ status: "uploading", fileName: file.name, fileSize: file.size, progress: 0 });
    onBusyChange(true);

    const handle = uploadPodcastAudio(createClient(), file, (progress) =>
      setUpload((prev) => (prev.status === "uploading" ? { ...prev, progress } : prev))
    );
    abortRef.current = handle.abort;

    try {
      const url = await handle.promise;
      onUploaded(url);
      setUploadUrl(url);
      onChange(url);
      setUpload({ status: "done", fileName: file.name, fileSize: file.size });
    } catch (err) {
      // الملف السابق (إن وُجد) يبقى كما هو ولا يتغيّر شيء في الحلقة
      setUpload(previous);
      setError(err instanceof PodcastAudioUploadError ? err.message : "حدث خطأ أثناء رفع الملف، حاول مرة أخرى.");
    } finally {
      abortRef.current = null;
      onBusyChange(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removeFile() {
    setUploadUrl("");
    setUpload({ status: "idle" });
    setError("");
    onChange("");
  }

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-fit border border-border" role="group" aria-label="طريقة إضافة الصوت">
        <button
          type="button"
          aria-pressed={mode === "upload"}
          disabled={uploading}
          onClick={() => selectMode("upload")}
          className={modeButton(mode === "upload")}
        >
          رفع ملف MP3
        </button>
        <button
          type="button"
          aria-pressed={mode === "link"}
          disabled={uploading}
          onClick={() => selectMode("link")}
          className={modeButton(mode === "link")}
        >
          رابط خارجي
        </button>
      </div>

      {mode === "upload" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className="flex flex-col gap-3"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={handleInputChange}
            className="hidden"
          />

          {upload.status === "uploading" ? (
            <div className="flex flex-col gap-3 border border-border p-4">
              <FileMeta name={upload.fileName} size={upload.fileSize} />
              <div
                className="h-1.5 w-full bg-secondary"
                role="progressbar"
                aria-label="تقدّم رفع الملف"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={upload.progress}
              >
                <div className="h-full bg-foreground transition-[width]" style={{ width: `${upload.progress}%` }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" role="status">
                  جارٍ رفع الملف... {upload.progress}%
                </p>
                <button
                  type="button"
                  onClick={() => abortRef.current?.()}
                  className="text-sm text-destructive transition-opacity hover:opacity-70"
                >
                  إلغاء الرفع
                </button>
              </div>
            </div>
          ) : uploadUrl ? (
            <div
              className={`flex flex-col gap-3 border p-4 ${dragging ? "border-foreground bg-secondary/60" : "border-border"}`}
            >
              <span className="text-xs text-muted-foreground">
                {upload.status === "done" ? "الملف المرفوع" : "الملف الحالي"}
              </span>
              {upload.status === "done" ? (
                <FileMeta name={upload.fileName} size={upload.fileSize} />
              ) : (
                <FileMeta name={audioFileNameFromUrl(uploadUrl)} />
              )}
              {upload.status === "done" && (
                <p className="text-sm text-foreground" role="status">
                  تم رفع الملف بنجاح. اضغط «حفظ» لاعتماده في الحلقة.
                </p>
              )}
              <audio controls preload="none" src={uploadUrl} className="w-full" />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openPicker}
                  className="border border-border px-4 py-2 text-sm text-foreground transition-opacity hover:opacity-70"
                >
                  استبدال الملف
                </button>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-sm text-destructive transition-opacity hover:opacity-70"
                >
                  حذف الملف
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              className={`flex flex-col items-center gap-2 border border-dashed px-4 py-8 text-center transition-colors ${
                dragging ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground"
              }`}
            >
              <span className="border border-border bg-background px-4 py-2 text-sm text-foreground">
                اختر ملف MP3
              </span>
              <span className="text-sm text-muted-foreground">أو اسحب الملف هنا</span>
              <span className="text-xs text-muted-foreground">
                صيغة MP3 فقط، والحد الأقصى {PODCAST_AUDIO_LIMIT_LABEL}
              </span>
            </button>
          )}

          {!uploadUrl && !uploading && initialIsStored && (
            <p className="text-xs text-muted-foreground">سيُزال الملف السابق من الحلقة عند الحفظ.</p>
          )}
          {!uploadUrl && !uploading && linkUrl && (
            <p className="text-xs text-muted-foreground">
              الرابط الخارجي المحفوظ لن يُستخدم إلا إذا عدت إلى خيار «رابط خارجي».
            </p>
          )}
        </div>
      )}

      {mode === "link" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audio_external_url" className="text-sm text-foreground">
            الرابط الصوتي الخارجي
          </label>
          <p className="text-xs text-muted-foreground">
            استخدم هذا الخيار فقط إذا كان الملف الصوتي مستضافاً خارج الموقع.
          </p>
          <input
            id="audio_external_url"
            type="text"
            inputMode="url"
            dir="ltr"
            placeholder="https://"
            value={linkUrl}
            onChange={(e) => {
              setLinkUrl(e.target.value);
              onChange(e.target.value);
            }}
            className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-foreground"
          />
          {uploadUrl && (
            <p className="text-xs text-muted-foreground">
              عند الحفظ سيُستخدم الرابط الخارجي بدل الملف المرفوع.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FileMeta({ name, size }: { name: string; size?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="truncate text-sm font-medium text-foreground">
        <bdi dir="ltr">{name}</bdi>
      </p>
      {size !== undefined && (
        <p className="text-xs text-muted-foreground">
          <bdi dir="ltr">{formatFileSize(size)}</bdi>
        </p>
      )}
    </div>
  );
}
