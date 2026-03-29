-- ── Create Tables ──────────────────────────────────────────────────────────

create table testimonials (
  id uuid default gen_random_uuid() primary key,
  name text,
  initial text,
  service text,
  quote text,
  "order" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table services (
  id uuid default gen_random_uuid() primary key,
  title text,
  price text,
  unit text,
  icon text,
  "imageUrl" text,
  features text[],
  description text,
  "order" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table gallery (
  id uuid default gen_random_uuid() primary key,
  label text,
  alt text,
  "imageUrl" text,
  "order" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table videos (
  id uuid default gen_random_uuid() primary key,
  title text,
  description text,
  "videoUrl" text,
  "thumbnailUrl" text,
  "order" numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ── Enable Row Level Security (RLS) ──────────────────────────────────────
alter table testimonials enable row level security;
alter table services enable row level security;
alter table gallery enable row level security;
alter table videos enable row level security;

-- ── Policies: Public Read ────────────────────────────────────────────────
create policy "Public read access for testimonials" on testimonials for select to public using (true);
create policy "Public read access for services" on services for select to public using (true);
create policy "Public read access for gallery" on gallery for select to public using (true);
create policy "Public read access for videos" on videos for select to public using (true);

-- ── Policies: Authenticated Write ────────────────────────────────────────
create policy "Auth write access for testimonials" on testimonials for all to authenticated using (true) with check (true);
create policy "Auth write access for services" on services for all to authenticated using (true) with check (true);
create policy "Auth write access for gallery" on gallery for all to authenticated using (true) with check (true);
create policy "Auth write access for videos" on videos for all to authenticated using (true) with check (true);

-- Create your bucket named "assets" manually in the Supabase Storage UI before running the policies below!

create policy "Public read access for storage" on storage.objects for select to public using (bucket_id = 'assets');
create policy "Auth write access for storage" on storage.objects for insert to authenticated with check (bucket_id = 'assets');
create policy "Auth update access for storage" on storage.objects for update to authenticated using (bucket_id = 'assets');
create policy "Auth delete access for storage" on storage.objects for delete to authenticated using (bucket_id = 'assets');
