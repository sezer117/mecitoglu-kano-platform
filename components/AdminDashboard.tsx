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

export default function AdminDashboard({ email }: { email: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tümü");

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

  async function updateStatus(id: string, durum: Reservation["durum"]) {
    await supabase.from("rezervasyonlar").update({ durum }).eq("id", id);
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
          <h2>Rezervasyonlar</h2>
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
                  <tr key={row.id}>
                    <td><strong>{row.tarih}</strong><br/><span>{row.saat}</span></td>
                    <td><strong>{row.ad_soyad}</strong><br/><a href={`tel:${row.telefon}`}>{row.telefon}</a>{row.notlar && <small className="block">Not: {row.notlar}</small>}</td>
                    <td>{row.kisi_sayisi}</td>
                    <td><span className={`badge ${row.durum.toLowerCase().replace("ı","i")}`}>{row.durum}</span></td>
                    <td className="row-actions">
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
    </main>
  );
}
