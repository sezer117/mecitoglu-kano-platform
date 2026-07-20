-- ÖNEMLİ:
-- Daha önce oluşturduğun güvensiz "Admin Full Access" politikasını kaldırır
-- ve güvenli rezervasyon/admin kurallarını kurar.

create extension if not exists "pgcrypto";

alter table public.rezervasyonlar
  alter column durum set default 'Bekliyor';

alter table public.rezervasyonlar
  add constraint rezervasyon_durum_check
  check (durum in ('Bekliyor', 'Onaylandı', 'İptal')) not valid;

alter table public.rezervasyonlar
  add constraint kisi_sayisi_check
  check (kisi_sayisi between 1 and 10) not valid;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.rezervasyonlar enable row level security;

drop policy if exists "Admin Full Access" on public.rezervasyonlar;
drop policy if exists "public_create_reservation" on public.rezervasyonlar;
drop policy if exists "admin_read_reservations" on public.rezervasyonlar;
drop policy if exists "admin_update_reservations" on public.rezervasyonlar;
drop policy if exists "admin_delete_reservations" on public.rezervasyonlar;
drop policy if exists "admin_read_self" on public.admin_users;

create policy "public_create_reservation"
on public.rezervasyonlar for insert
to anon, authenticated
with check (
  durum = 'Bekliyor'
  and tarih >= current_date
  and kisi_sayisi between 1 and 10
);

create policy "admin_read_reservations"
on public.rezervasyonlar for select
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = auth.uid()
));

create policy "admin_update_reservations"
on public.rezervasyonlar for update
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = auth.uid()
))
with check (exists (
  select 1 from public.admin_users a where a.user_id = auth.uid()
));

create policy "admin_delete_reservations"
on public.rezervasyonlar for delete
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = auth.uid()
));

create policy "admin_read_self"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- İptal edilmeyen aynı tarih+saat için ikinci rezervasyonu engeller.
create unique index if not exists rezervasyon_aktif_seans_unique
on public.rezervasyonlar (tarih, saat)
where durum <> 'İptal';

-- Ziyaretçiye müşteri bilgilerini göstermeden yalnızca dolu saatleri döndürür.
create or replace function public.get_booked_slots(selected_date date)
returns table (saat text)
language sql
security definer
set search_path = public
as $$
  select r.saat
  from public.rezervasyonlar r
  where r.tarih = selected_date
    and r.durum <> 'İptal'
  order by r.saat;
$$;

revoke all on function public.get_booked_slots(date) from public;
grant execute on function public.get_booked_slots(date) to anon, authenticated;

-- AŞAĞIDAKİ E-POSTAYI, Authentication > Users bölümünde oluşturduğun
-- gerçek yönetici e-postasıyla değiştir ve bu satırı çalıştır:
--
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@mecitoglugrup.com'
-- on conflict (user_id) do nothing;
