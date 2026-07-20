# Mecitoğlu Grup – Adana Kano Rezervasyon Platformu v4

Bu paket, ödeme hariç aşağıdaki özellikleri içerir:

- 09:00–18:00 arası yarım saatlik seanslar
- Geçmiş tarihlerin kapatıldığı takvim seçimi
- Dolu saatlerin otomatik kapanması
- Yönetici giriş sistemi
- Bekleyen / onaylanan / iptal edilen rezervasyonlar
- Rezervasyon ayrıntı penceresi
- Yönetici tarafından tarih ve saat değiştirme
- Dolu saate taşımanın engellenmesi
- Günlük takvim görünümü
- Rezervasyonu sürükleyerek başka saate taşıma
- İstatistik kutuları
- CSV/Excel dışa aktarma
- Tarayıcıdan PDF/yazdırma
- Tek tıkla WhatsApp mesajı
- QR kod ve herkese açık sınırlı doğrulama sayfası
- İsteğe bağlı Resend e-posta bildirimi

## Kurulum

### 1. GitHub

Mevcut `mecitoglu-kano-platform` reposundaki dosyaları bu paketin içeriğiyle değiştirin.
ZIP dosyasını değil, ZIP içindeki dosya ve klasörleri yükleyin.

### 2. Supabase SQL

Supabase > SQL Editor > New Query bölümünde:

`supabase/upgrade-v4.sql`

dosyasının tamamını çalıştırın.

### 3. Vercel ortam değişkenleri

Zorunlu ve mevcut olanlar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

QR bağlantısı için önerilen:

- `NEXT_PUBLIC_APP_URL` = canlı Vercel adresiniz

E-posta bildirimleri istenirse ayrıca:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ADMIN_NOTIFICATION_EMAIL`

E-posta değişkenleri eklenmezse sistem normal çalışır; yalnızca otomatik e-posta atlanır.

## WhatsApp hakkında

Paket, yöneticinin rezervasyon detayından tek tıkla hazır mesaj açmasını sağlar.
Gerçek anlamda arka planda otomatik WhatsApp gönderimi için Meta WhatsApp Business Cloud API hesabı ve onaylı mesaj şablonları gerekir.

## Test adresleri

- `/rezervasyon`
- `/admin/login`
- `/dogrula/<rezervasyon-id>`
