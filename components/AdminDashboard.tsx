"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Reservation = {
  id: string;
  ad_soyad: string;
  telefon: string;
  email: string | null;
  tarih: string;
  saat: string;
  kisi_sayisi: number;
  durum: "Bekliyor" | "Onaylandı" | "İptal";
  notlar: string | null;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(new Date(`${date}T12:00:00`));
}

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function AdminDashboard({ email }: { email: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tümü");
  const [selected, setSelected] = useState<Reservation | null>(null);
  
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("rezervasyonlar")
      .select("*")
      .order("tarih", { ascending: true })
      .order("saat", { ascending: true });
    setRows((data as Reservation[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function updateStatus(id: string, durum: Reservation["durum"]) {
    await supabase.from("rezervasyonlar").update({ durum }).eq("id", id);
    setSelected(current => current?.id === id ? { ...current, durum } : current);
    await load();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const visible = filter === "Tümü" ? rows : rows.filter(r => r.durum === filter);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter(r => r.tarih === today && r.durum !== "İptal").length;
  const pending = rows.filter(r => r.durum === "Bekliyor").length;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">MECİTOĞLU GRUP</p>
          <h1>Kano Rezervasyon Yönetimi</h1>
          <span>{email}</span>
        </div>
        <button className="btn btn-secondary" onClick={logout}>Çıkış Yap</button>
      </header>

      <section className="stats">
        <article><span>Bugün</span><strong>{todayCount}</strong><small>aktif rezervasyon</small></article>
        <article><span>Bekleyen</span><strong>{pending}</strong><small>onay bekliyor</small></article>
        <article><span>Toplam</span><strong>{rows.length}</strong><small>kayıt</small></article>
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <h2>Rezervasyonlar</h2>
            <p className="panel-hint">Ayrıntıları görmek için rezervasyon satırına tıklayın.</p>
          </div>
          <div className="filters">
            {["Tümü", "Bekliyor", "Onaylandı", "İptal"].map(item => (
              <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
        </div>

        {loading ? <p>Yükleniyor...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tarih / Saat</th><th>Müşteri</th><th>Kişi</th><th>Durum</th><th>İşlem</th></tr></thead>
              <tbody>
                {visible.map(row => (
                  <tr key={row.id} className="clickable-row" onClick={() => setSelected(row)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setSelected(row); }}>
                    <td><strong>{row.tarih}</strong><br/><span>{row.saat}</span></td>
                    <td><strong>{row.ad_soyad}</strong><br/><a href={`tel:${row.telefon}`} onClick={(e) => e.stopPropagation()}>{row.telefon}</a>{row.notlar && <small className="block">Not: {row.notlar}</small>}</td>
                    <td>{row.kisi_sayisi}</td>
                    <td><span className={`badge ${row.durum.toLowerCase().replace("ı","i")}`}>{row.durum}</span></td>
                    <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => updateStatus(row.id, "Onaylandı")}>Onayla</button>
                      <button onClick={() => updateStatus(row.id, "İptal")}>İptal</button>
                    </td>
                  </tr>
                ))}
                {!visible.length && <tr><td colSpan={5}>Kayıt bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <section className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-detail-title">
            <button className="modal-close" onClick={() => setSelected(null)} aria-label="Kapat">×</button>
            <p className="eyebrow">REZERVASYON AYRINTISI</p>
            <h2 id="reservation-detail-title">{selected.ad_soyad}</h2>
            <div className="detail-grid">
              <article><span>Tarih</span><strong>{formatDate(selected.tarih)}</strong></article>
              <article><span>Saat</span><strong>{selected.saat}</strong></article>
              <article><span>Kişi Sayısı</span><strong>{selected.kisi_sayisi} kişi</strong></article>
              <article><span>Durum</span><strong><span className={`badge ${selected.durum.toLowerCase().replace("ı","i")}`}>{selected.durum}</span></strong></article>
              <article><span>Telefon</span><strong><a href={`tel:${selected.telefon}`}>{selected.telefon}</a></strong></article>
              <article><span>E-posta</span><strong>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : "Belirtilmedi"}</strong></article>
              <article className="detail-wide"><span>Müşteri Notu</span><strong>{selected.notlar || "Not bulunmuyor."}</strong></article>
              <article className="detail-wide"><span>Kayıt Tarihi</span><strong>{formatCreatedAt(selected.created_at)}</strong></article>
            </div>
            <div className="modal-actions">
              <a className="btn btn-secondary" href={`tel:${selected.telefon}`}>Müşteriyi Ara</a>
              <button className="btn approve-btn" onClick={() => updateStatus(selected.id, "Onaylandı")}>Onayla</button>
              <button className="btn cancel-btn" onClick={() => updateStatus(selected.id, "İptal")}>İptal Et</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
