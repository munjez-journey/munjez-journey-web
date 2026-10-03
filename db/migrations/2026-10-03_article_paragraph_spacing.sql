-- المسافة بين الفقرات + تفعيل/تعطيل الفقرة الافتتاحية البارزة، لكل مقال.
-- آمنة لإعادة التشغيل، والمقالات القديمة تأخذ القيم الافتراضية (لا يتغيّر شيء عليها).

alter table public.articles
  add column if not exists paragraph_spacing text not null default 'normal';

alter table public.articles
  add column if not exists highlight_first_paragraph boolean not null default true;

alter table public.articles
  drop constraint if exists articles_paragraph_spacing_check;

alter table public.articles
  add constraint articles_paragraph_spacing_check
  check (paragraph_spacing in ('compact', 'normal', 'relaxed', 'spacious'));
