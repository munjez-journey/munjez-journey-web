-- تخزين ملفات MP3 لحلقات البودكاست في bucket مستقل: podcast-audio
-- لا يغيّر أي جدول ولا أي عمود: الرابط العام للملف يُحفظ في podcast_episodes.audio_url كما هو الآن.
-- لا يمسّ bucket الصور (images) ولا سياساته. آمن لإعادة التشغيل.
--
-- الصلاحيات:
--   - القراءة: الـbucket عام، فالمشغّل يقرأ الملف عبر الرابط العام
--     /storage/v1/object/public/podcast-audio/... دون الحاجة إلى أي سياسة.
--     لا نضيف سياسة SELECT للزوار حتى لا يستطيع أحد سرد قائمة الملفات عبر الـAPI.
--   - الرفع والحذف: فقط لمستخدم authenticated تتحقق له public.is_admin().
--   - الاستبدال (overwrite/UPDATE): غير مسموح لأحد. كل رفع يُنشئ مساراً جديداً فريداً،
--     و«استبدال الملف» في اللوحة = رفع ملف جديد ثم حذف القديم بعد نجاح الحفظ.
--
-- حدّ الحجم: 50MB (52428800 بايت) — يجب أن يطابق PODCAST_AUDIO_MAX_BYTES في lib/podcastAudio.ts.
-- ملاحظة: الحد الفعلي = الأصغر بين هذا الحد وحد الرفع العام للمشروع
-- (Project Settings → Storage → Upload file size limit؛ في الخطة المجانية 50MB كحد أقصى).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('podcast-audio', 'podcast-audio', true, 52428800, array['audio/mpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- قراءة بيانات الملفات عبر الـAPI للأدمن فقط (مطلوبة كي يعمل الحذف من Storage).
drop policy if exists "admin read podcast audio" on storage.objects;
create policy "admin read podcast audio"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'podcast-audio' and public.is_admin());

drop policy if exists "admin upload podcast audio" on storage.objects;
create policy "admin upload podcast audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'podcast-audio' and public.is_admin());

drop policy if exists "admin delete podcast audio" on storage.objects;
create policy "admin delete podcast audio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'podcast-audio' and public.is_admin());

-- التراجع (عند الحاجة فقط، وبعد التأكد أن الـbucket فارغ):
--   drop policy if exists "admin read podcast audio" on storage.objects;
--   drop policy if exists "admin upload podcast audio" on storage.objects;
--   drop policy if exists "admin delete podcast audio" on storage.objects;
--   delete from storage.buckets where id = 'podcast-audio';
