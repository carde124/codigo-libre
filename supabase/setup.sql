-- =============================================================
-- Código Libre — configuración de la base de datos de contactos
-- Pega TODO este archivo en Supabase → SQL Editor → Run
-- =============================================================

-- Tabla donde se guardan los envíos del formulario de contacto
create table if not exists public.contactos (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nombre        text not null,
  email         text not null,
  pais          text not null,
  empresa       text,
  configuracion text,
  mensaje       text not null,
  ip_hash       text
);

-- Row Level Security: activada y SIN políticas para anon/authenticated.
-- Resultado: nadie puede leer ni escribir en esta tabla desde el navegador
-- ni con la clave pública (anon key). Solo el backend de Vercel (que usa la
-- service_role key) puede insertar, y solo tú puedes leer los mensajes
-- desde el panel de Supabase (Table Editor).
alter table public.contactos enable row level security;

revoke all on table public.contactos from anon, authenticated;

-- Índice para el rate limiting (contar envíos recientes por IP)
create index if not exists contactos_ip_hash_created_idx
  on public.contactos (ip_hash, created_at);
