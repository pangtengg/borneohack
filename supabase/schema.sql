create table if not exists glossary_entries (
  id           uuid default gen_random_uuid() primary key,
  dialect_id   text not null,
  slang        text not null,
  formal       text not null,
  target_lang  text not null default 'ms',
  notes        text,
  created_at   timestamptz default now()
);

create table if not exists ghost_phrases (
  id             uuid default gen_random_uuid() primary key,
  language_name  text not null,
  language_code  text not null,
  phrase_text    text not null,
  meaning_en     text not null,
  meaning_ms     text,
  context_tag    text not null default 'emergency',
  storage_path   text not null,
  mfcc_cache     jsonb,
  recorded_by    text,
  created_at     timestamptz default now()
);

create table if not exists translation_logs (
  id             uuid default gen_random_uuid() primary key,
  layer_used     text not null,
  raw_transcript text,
  detected_lang  text,
  patched_text   text,
  final_output   text,
  confidence     float,
  session_id     text,
  created_at     timestamptz default now()
);

create index if not exists idx_glossary_dialect on glossary_entries(dialect_id);
create index if not exists idx_ghost_lang on ghost_phrases(language_code);
