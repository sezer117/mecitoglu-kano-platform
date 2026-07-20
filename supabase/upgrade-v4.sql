-- Mecitoğlu Kano Platform v4 yükseltmesi
-- Mevcut tabloları silmez.

-- QR doğrulama ekranına yalnızca sınırlı bilgiler verir.
create or replace function public.get_reservation_verification(reservation_id uuid)
returns table (
  ad_soyad text,
  tarih date,
  saat text,
  kisi_sayisi integer,
  durum text
)
language sql
security definer
set search_path = public
as $$
  select r.ad_soyad, r.tarih, r.saat, r.kisi_sayisi, r.durum
  from public.rezervasyonlar r
  where r.id = reservation_id;
$$;

revoke all on function public.get_reservation_verification(uuid) from public;
grant execute on function public.get_reservation_verification(uuid) to anon, authenticated;

-- Admin güncellemelerinin çalışması için idempotent politika.
drop policy if exists "admin_update_rezervasyonlar" on public.rezervasyonlar;
create policy "admin_update_rezervasyonlar"
on public.rezervasyonlar
for update
to authenticated
using (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where admin_users.user_id = auth.uid()));

grant update on table public.rezervasyonlar to authenticated;
