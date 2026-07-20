"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
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

const SESSION_TIMES = Array.from({ length: 19 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
});

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long", year: "numeric", weekday: "long" }).format(new Date(`${date}T12:00:00`));
}

function formatCreatedAt(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return digits;
  if (digits.startsWith("0")) return `9${digits}`;
  return `90${digits}`;
}

function statusClass(value: string) {
  return value.toLocaleLowerCase("tr-TR").replaceAll("ı", "i").replaceAll("ş", "s").replaceAll("İ", "i");
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
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(todayLocal());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rezervasyonlar")
      .select("*")
      .order("tarih", { ascending: true })
      .order("saat", { ascending: true });
    if (error) alert(`Rezervasyonlar yüklenemedi: ${error.message}`);
    setRows((data as Reservation[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (selected) {
      setEditDate(selected.tarih);
      setEditTime(selected.saat);
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      void QRCode.toDataURL(`${base}/dogrula/${selected.id}`, { width: 260, margin: 2 }).then(setQrDataUrl);
    } else {
      setQrDataUrl("");
    }
  }, [selected]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setSelected(null); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function notify(type: "approved" | "cancelled" | "moved", reservation: Reservation) {
    void fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, reservation }),
    });
  }

  async function updateStatus(id: string, durum: Reservation["durum"]) {
    const { error } = await supabase.from("rezervasyonlar").update({ durum }).eq("id", id);
    if (error) {
      alert(`Durum güncellenemedi: ${error.message}`);
      return;
    }
    const changed = rows.find(row => row.id === id);
    setSelected(current => current?.id === id ? { ...current, durum } : current);
    await load();
    if (changed && durum === "Onaylandı") await notify("approved", { ...changed, durum });
    if (changed && durum === "İptal") await notify("cancelled", { ...changed, durum });
  }

  async function moveReservation(id: string, date: string, time: string) {
    setSaving(true);
    const current = rows.find(row => row.id === id);
    const { data: existing, error: checkError } = await supabase
      .from("rezervasyonlar")
      .select("id")
      .eq("tarih", date)
      .eq("saat", time)
      .neq("id", id)
      .neq("durum", "İptal")
      .limit(1);

    if (checkError) {
      alert(`Müsaitlik kontrol edilemedi: ${checkError.message}`);
      setSaving(false);
      return false;
    }
    if (existing?.length) {
      alert("Bu tarih ve saat dolu. Başka bir saat seçin.");
      setSaving(false);
      return false;
    }

    const { error } = await supabase.from("rezervasyonlar").update({ tarih: date, saat: time }).eq("id", id);
    if (error) {
      alert(`Tarih ve saat güncellenemedi: ${error.message}`);
      setSaving(false);
      return false;
    }
    const changed = current ? { ...current, tarih: date, saat: time } : null;
    setSelected(value => value?.id === id ? { ...value, tarih: date, saat: time } : value);
    await load();
    if (changed) await notify("moved", changed);
    setSaving(false);
    return true;
  }

  async function updateReservationDateTime() {
    if (!selected || !editDate || !editTime) return alert("Lütfen tarih ve saat seçin.");
    const ok = await moveReservation(selected.id, editDate, editTime);
    if (ok) alert("Rezervasyon tarihi ve saati güncellendi.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  function exportCsv() {
    const header = ["Tarih", "Saat", "Ad Soyad", "Telefon", "E-posta", "Kişi", "Durum", "Not"];
    const csvRows = rows.map(r => [r.tarih, r.saat, r.ad_soyad, r.telefon, r.email ?? "", String(r.kisi_sayisi), r.durum, r.notlar ?? ""]);
    const content = [header, ...csvRows].map(line => line.map(v => `"${v.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kano-rezervasyonlari-${todayLocal()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() { window.print(); }

  const visible = filter === "Tümü" ? rows : rows.filter(r => r.durum === filter);
  const today = todayLocal();
  const todayCount = rows.filter(r => r.tarih === today && r.durum !== "İptal").length;
  const pending = rows.filter(r => r.durum === "Bekliyor").length;
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); weekStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = rows.filter(r => r.durum !== "İptal");
  const weekCount = active.filter(r => new Date(`${r.tarih}T12:00:00`) >= weekStart).length;
  const monthRows = active.filter(r => new Date(`${r.tarih}T12:00:00`) >= monthStart);
  const monthPeople = monthRows.reduce((sum, r) => sum + r.kisi_sayisi, 0);
  const hourCounts = active.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.saat]: (acc[r.saat] || 0) + 1 }), {});
  const busiestHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] ?? "—";
  const calendarRows = rows.filter(r => r.tarih === calendarDate && r.durum !== "İptal");

  const whatsappText = selected ? encodeURIComponent(`Merhaba ${selected.ad_soyad}, ${formatDate(selected.tarih)} saat ${selected.saat} tarihli Adana Kano Keyfi rezervasyonunuz ${selected.durum.toLocaleLowerCase("tr-TR")} durumundadır. Mecitoğlu Grup`) : "";

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div><p className="eyebrow">MECİTOĞLU GRUP</p><h1>Kano Rezervasyon Yönetimi</h1><span>{email}</span></div>
        <div className="header-actions"><button className="btn btn-secondary" onClick={exportCsv}>Excel / CSV</button><button className="btn btn-secondary" onClick={printPdf}>PDF / Yazdır</button><button className="btn btn-secondary" onClick={logout}>Çıkış Yap</button></div>
      </header>

      <section className="stats extended-stats">
        <article><span>Bugün</span><strong>{todayCount}</strong><small>aktif rezervasyon</small></article>
        <article><span>Bekleyen</span><strong>{pending}</strong><small>onay bekliyor</small></article>
        <article><span>Bu Hafta</span><strong>{weekCount}</strong><small>rezervasyon</small></article>
        <article><span>Bu Ay Kişi</span><strong>{monthPeople}</strong><small>katılımcı</small></article>
        <article><span>Yoğun Saat</span><strong className="small-stat">{busiestHour}</strong><small>en çok tercih edilen</small></article>
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div><h2>{view === "list" ? "Rezervasyonlar" : "Günlük Takvim"}</h2><p className="panel-hint">{view === "list" ? "Ayrıntıları görmek için satıra tıklayın." : "Rezervasyonu tutup başka bir saate sürükleyebilirsiniz."}</p></div>
          <div className="toolbar"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Liste</button><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Takvim</button></div>
        </div>

        {view === "list" ? (
          <>
            <div className="filters">{["Tümü", "Bekliyor", "Onaylandı", "İptal"].map(item => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
            {loading ? <p>Yükleniyor...</p> : <div className="table-wrap"><table><thead><tr><th>Tarih / Saat</th><th>Müşteri</th><th>Kişi</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
              {visible.map(row => <tr key={row.id} className="clickable-row" onClick={() => setSelected(row)} tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setSelected(row); }}>
                <td><strong>{row.tarih}</strong><br/><span>{row.saat}</span></td><td><strong>{row.ad_soyad}</strong><br/><a href={`tel:${row.telefon}`} onClick={e => e.stopPropagation()}>{row.telefon}</a></td><td>{row.kisi_sayisi}</td><td><span className={`badge ${statusClass(row.durum)}`}>{row.durum}</span></td><td className="row-actions" onClick={e => e.stopPropagation()}><button onClick={() => updateStatus(row.id, "Onaylandı")}>Onayla</button><button onClick={() => updateStatus(row.id, "İptal")}>İptal</button></td>
              </tr>)}
              {!visible.length && <tr><td colSpan={5}>Kayıt bulunamadı.</td></tr>}
            </tbody></table></div>}
          </>
        ) : (
          <div className="calendar-admin">
            <label className="calendar-date-control"><span>Takvim Tarihi</span><input type="date" value={calendarDate} onChange={e => setCalendarDate(e.target.value)} /></label>
            <div className="calendar-slots">
              {SESSION_TIMES.map(time => {
                const reservation = calendarRows.find(r => r.saat === time);
                return <div key={time} className={`calendar-slot ${reservation ? "occupied" : "empty"}`} onDragOver={e => e.preventDefault()} onDrop={async () => { if (draggedId) { await moveReservation(draggedId, calendarDate, time); setDraggedId(null); } }}>
                  <time>{time}</time>
                  {reservation ? <button draggable onDragStart={() => setDraggedId(reservation.id)} onClick={() => setSelected(reservation)} className="calendar-reservation"><strong>{reservation.ad_soyad}</strong><small>{reservation.kisi_sayisi} kişi · {reservation.durum}</small></button> : <span>Boş</span>}
                </div>;
              })}
            </div>
          </div>
        )}
      </section>

      {selected && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}><section className="reservation-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={() => setSelected(null)} aria-label="Kapat">×</button><p className="eyebrow">REZERVASYON AYRINTISI</p><h2>{selected.ad_soyad}</h2>
        <div className="detail-grid"><article><span>Tarih</span><strong>{formatDate(selected.tarih)}</strong></article><article><span>Saat</span><strong>{selected.saat}</strong></article><article><span>Kişi Sayısı</span><strong>{selected.kisi_sayisi} kişi</strong></article><article><span>Durum</span><strong><span className={`badge ${statusClass(selected.durum)}`}>{selected.durum}</span></strong></article><article><span>Telefon</span><strong><a href={`tel:${selected.telefon}`}>{selected.telefon}</a></strong></article><article><span>E-posta</span><strong>{selected.email ? <a href={`mailto:${selected.email}`}>{selected.email}</a> : "Belirtilmedi"}</strong></article><article className="detail-wide"><span>Müşteri Notu</span><strong>{selected.notlar || "Not bulunmuyor."}</strong></article><article className="detail-wide"><span>Kayıt Tarihi</span><strong>{formatCreatedAt(selected.created_at)}</strong></article></div>
        <div className="admin-edit-datetime"><label><span>Yeni Tarih</span><input type="date" min={todayLocal()} value={editDate} onChange={e => setEditDate(e.target.value)} /></label><label><span>Yeni Saat</span><select value={editTime} onChange={e => setEditTime(e.target.value)}>{SESSION_TIMES.map(time => <option key={time}>{time}</option>)}</select></label><button className="btn btn-primary" onClick={updateReservationDateTime} disabled={saving}>{saving ? "Kaydediliyor..." : "Tarih ve Saati Kaydet"}</button></div>
        <div className="qr-section">{qrDataUrl && <img src={qrDataUrl} alt="Rezervasyon QR kodu" />}<div><strong>QR Doğrulama</strong><p>Girişte okutularak rezervasyon bilgisi doğrulanabilir.</p></div></div>
        <div className="modal-actions"><a className="btn btn-secondary" href={`tel:${selected.telefon}`}>Ara</a><a className="btn whatsapp-btn" target="_blank" rel="noreferrer" href={`https://wa.me/${normalizePhone(selected.telefon)}?text=${whatsappText}`}>WhatsApp</a><button className="btn approve-btn" onClick={() => updateStatus(selected.id, "Onaylandı")}>Onayla</button><button className="btn cancel-btn" onClick={() => updateStatus(selected.id, "İptal")}>İptal Et</button></div>
      </section></div>}
    </main>
  );
}
