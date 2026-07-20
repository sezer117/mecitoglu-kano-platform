import { createClient } from "@/lib/supabase/server";

type Verification = {
  ad_soyad: string;
  tarih: string;
  saat: string;
  kisi_sayisi: number;
  durum: string;
};

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_reservation_verification", { reservation_id: id });
  const item = (data?.[0] as Verification | undefined);

  return (
    <main className="verify-shell">
      <section className="verify-card">
        <div className="brand-mark">M</div>
        <p className="eyebrow">ADANA KANO KEYFİ</p>
        {error || !item ? (
          <><h1>Rezervasyon Bulunamadı</h1><p>QR kod geçersiz veya kayıt artık mevcut değil.</p></>
        ) : (
          <>
            <div className={`verify-icon ${item.durum === "Onaylandı" ? "valid" : "pending"}`}>{item.durum === "Onaylandı" ? "✓" : "i"}</div>
            <h1>{item.durum === "Onaylandı" ? "Rezervasyon Doğrulandı" : "Rezervasyon Kaydı"}</h1>
            <div className="verify-details"><p><span>Misafir</span><strong>{item.ad_soyad}</strong></p><p><span>Tarih</span><strong>{item.tarih}</strong></p><p><span>Saat</span><strong>{item.saat}</strong></p><p><span>Kişi</span><strong>{item.kisi_sayisi}</strong></p><p><span>Durum</span><strong>{item.durum}</strong></p></div>
          </>
        )}
      </section>
    </main>
  );
}
