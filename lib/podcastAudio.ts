import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * الحد الأقصى لحجم ملف MP3 لحلقة البودكاست (50MB).
 * هذا هو المكان الوحيد لهذا الرقم في الكود. عند تغييره حدّث أيضاً file_size_limit
 * لـ bucket podcast-audio (انظر db/migrations/2026-10-07_podcast_audio_storage.sql)،
 * وتأكد أنه لا يتجاوز حد الرفع العام للمشروع في إعدادات Supabase Storage.
 */
export const PODCAST_AUDIO_MAX_BYTES = 52428800;

export const PODCAST_AUDIO_BUCKET = "podcast-audio";

export const PODCAST_AUDIO_LIMIT_LABEL = `${Math.round(
  PODCAST_AUDIO_MAX_BYTES / (1024 * 1024)
)} ميجابايت`;

const PODCAST_AUDIO_MIME = "audio/mpeg";

// كل ملف يُرفع من اللوحة يأخذ مساراً بهذا الشكل بالضبط. أي رابط لا يطابقه
// (رابط خارجي، ملف من bucket آخر...) لا يُعامَل كملف تابع لنا ولا يُحذف أبداً.
const STORAGE_PATH_PATTERN = /^episodes\/[0-9a-f-]{36}\/[a-z0-9_-]+\.mp3$/;

const MESSAGES = {
  generic: "حدث خطأ أثناء رفع الملف، حاول مرة أخرى.",
  network: "انقطع الاتصال أثناء رفع الملف. تحقّق من الإنترنت ثم حاول مرة أخرى.",
  aborted: "تم إلغاء رفع الملف.",
  unauthorized: "ليست لديك صلاحية رفع الملفات. سجّل الدخول بحساب الإدارة ثم حاول مرة أخرى.",
  invalidType: "صيغة الملف غير مدعومة. الرجاء اختيار ملف صوتي بصيغة MP3.",
  tooLarge: `حجم الملف أكبر من الحد المسموح (${PODCAST_AUDIO_LIMIT_LABEL}).`,
};

function publicPrefix(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PODCAST_AUDIO_BUCKET}/`;
}

/** مسار الملف داخل podcast-audio إن كان الرابط لملف رفعته اللوحة، وإلا null. */
export function storagePathFromAudioUrl(url: string): string | null {
  const prefix = publicPrefix();
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length).split(/[?#]/)[0];
  return STORAGE_PATH_PATTERN.test(path) ? path : null;
}

export function isStoredPodcastAudio(url: string): boolean {
  return storagePathFromAudioUrl(url) !== null;
}

export function audioFileNameFromUrl(url: string): string {
  const clean = url.split(/[?#]/)[0];
  return clean.slice(clean.lastIndexOf("/") + 1) || url;
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** يُرجع رسالة خطأ عربية إن كان الملف غير صالح، أو null إن كان صالحاً. */
export async function validatePodcastAudioFile(file: File): Promise<string | null> {
  const hasMp3Name = file.name.toLowerCase().endsWith(".mp3");
  const hasMp3Type = file.type === "" || file.type === "audio/mpeg" || file.type === "audio/mp3";
  if (!hasMp3Name || !hasMp3Type) return MESSAGES.invalidType;

  if (file.size === 0) return "الملف فارغ. الرجاء اختيار ملف MP3 صالح.";
  if (file.size > PODCAST_AUDIO_MAX_BYTES) {
    return `حجم الملف (${formatFileSize(file.size)}) أكبر من الحد المسموح (${PODCAST_AUDIO_LIMIT_LABEL}).`;
  }

  // ملف MP3 يبدأ إما بوسم ID3 أو مباشرة بإطار صوتي (11 بت مضبوطة على 1).
  const head = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  const hasId3 = head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
  const hasFrameSync = head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
  if (!hasId3 && !hasFrameSync) {
    return "هذا الملف لا يبدو ملف MP3 صالحاً. الرجاء اختيار ملف صوتي آخر.";
  }

  return null;
}

// مفاتيح Supabase Storage لا تقبل الحروف العربية، لذا نحتفظ بنسخة لاتينية آمنة
// من الاسم للعرض فقط، والتفرّد مضمون بالـUUID وليس بالاسم.
function safeBaseName(fileName: string): string {
  const base = fileName
    .replace(/\.mp3$/i, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return base || "episode";
}

function uploadErrorMessage(status: number, responseText: string): string {
  let code = String(status);
  let text = "";
  try {
    const body = JSON.parse(responseText) as { statusCode?: string | number; error?: string; message?: string };
    if (body.statusCode) code = String(body.statusCode);
    text = `${body.error ?? ""} ${body.message ?? ""}`;
  } catch {
    // ردّ غير JSON — نكتفي برمز الحالة
  }

  if (code === "413" || /maximum allowed size|too large/i.test(text)) return MESSAGES.tooLarge;
  if (code === "415" || /mime/i.test(text)) return MESSAGES.invalidType;
  if (code === "401" || code === "403" || /row-level security|unauthorized|jwt/i.test(text)) {
    return MESSAGES.unauthorized;
  }
  return MESSAGES.generic;
}

export class PodcastAudioUploadError extends Error {
  constructor(message: string, readonly aborted = false) {
    super(message);
  }
}

/**
 * يرفع الملف إلى podcast-audio بجلسة الأدمن الحالية (لا Service Role)، مع تقدّم حقيقي.
 * نستخدم XMLHttpRequest مباشرة لأن supabase-js لا يوفّر نسبة تقدّم الرفع.
 * المسار جديد دائماً، فلا يُكتب فوق أي ملف موجود.
 */
export function uploadPodcastAudio(
  supabase: SupabaseClient,
  file: File,
  onProgress: (percent: number) => void
): { promise: Promise<string>; abort: () => void } {
  const path = `episodes/${crypto.randomUUID()}/${safeBaseName(file.name)}.mp3`;
  const xhr = new XMLHttpRequest();
  let aborted = false;

  const promise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new PodcastAudioUploadError(MESSAGES.unauthorized);
    if (aborted) throw new PodcastAudioUploadError(MESSAGES.aborted, true);

    await new Promise<void>((resolve, reject) => {
      xhr.open(
        "POST",
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${PODCAST_AUDIO_BUCKET}/${path}`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${data.session!.access_token}`);
      xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      xhr.setRequestHeader("Content-Type", PODCAST_AUDIO_MIME);
      xhr.setRequestHeader("cache-control", "max-age=3600");
      xhr.setRequestHeader("x-upsert", "false");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new PodcastAudioUploadError(uploadErrorMessage(xhr.status, xhr.responseText)));
      };
      xhr.onerror = () => reject(new PodcastAudioUploadError(MESSAGES.network));
      xhr.ontimeout = () => reject(new PodcastAudioUploadError(MESSAGES.network));
      xhr.onabort = () => reject(new PodcastAudioUploadError(MESSAGES.aborted, true));

      xhr.send(file);
    });

    onProgress(100);
    return supabase.storage.from(PODCAST_AUDIO_BUCKET).getPublicUrl(path).data.publicUrl;
  })();

  return {
    promise,
    abort: () => {
      aborted = true;
      xhr.abort();
    },
  };
}

/**
 * يحذف ملف الحلقة من Storage فقط إن كان ملفاً رفعته اللوحة إلى podcast-audio
 * ولم يعد أي سجل في الجدول يشير إليه. الروابط الخارجية لا تُمسّ إطلاقاً.
 * أي فشل هنا يُتجاهل بهدوء: أسوأ نتيجة ملف زائد في Storage، لا حلقة مكسورة.
 */
export async function deleteStoredAudioIfUnused(
  supabase: SupabaseClient,
  url: string,
  table: string,
  column: string
): Promise<void> {
  const path = storagePathFromAudioUrl(url);
  if (!path) return;

  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .like(column, `%${path}%`);
    if (error || count === null || count > 0) return;

    await supabase.storage.from(PODCAST_AUDIO_BUCKET).remove([path]);
  } catch {
    // تنظيف اختياري — لا نُفشل العملية الأصلية بسببه
  }
}
