# Mecitoğlu Grup – Adana Kano Rezervasyon Sistemi

Bu proje:
- Müşteri rezervasyon sayfası
- Dolu seans kontrolü
- Supabase veritabanı
- Yalnızca yöneticiye açık admin paneli
- Onay / iptal yönetimi

içerir.

## 1) Supabase güvenlik kurulumu

Supabase > SQL Editor bölümünde:

`supabase/setup-secure.sql`

dosyasının tamamını çalıştır.

Dosyanın en altındaki yönetici ekleme sorgusunda e-posta adresini kendi
Authentication kullanıcının e-postasıyla değiştir, yorum işaretlerini kaldır ve çalıştır.

## 2) API bilgilerini al

Supabase:
Project Settings > API Keys

Şunları al:
- Project URL
- Publishable key (veya legacy anon key)

`service_role` anahtarını asla web sitesine veya GitHub'a koyma.

## 3) Yerel kurulum

`.env.example` dosyasını `.env.local` olarak kopyala:

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

Terminal:

npm install
npm run dev

Sonra:
- http://localhost:3000/rezervasyon
- http://localhost:3000/admin/login

## 4) GitHub ve Vercel

Yeni bir GitHub deposu oluşturup bu klasörün içeriğini yükle.
Vercel'de repoyu Import et.

Vercel > Settings > Environment Variables alanına:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

değerlerini ekle ve Redeploy yap.

## 5) Mevcut siteye bağlama

İlk test için ayrı bir Vercel adresinde yayınla.
Test tamamlanınca mevcut sitedeki “Rezervasyon” butonunu yeni projenin
`/rezervasyon` adresine yönlendir.

Ana site ile aynı domain altında gerçek `/rezervasyon` ve `/admin` yolları için,
son aşamada ana kurumsal siteyi bu Next.js projesine taşımak veya Vercel rewrites
kullanmak gerekir. Önce ayrı önizleme adresinde güvenli test önerilir.
