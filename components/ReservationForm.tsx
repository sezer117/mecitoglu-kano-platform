"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SESSION_TIMES = Array.from({ length: 19 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const hour = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minute = String(totalMinutes % 60).padStart(2, "0");
  return `${hour}:${minute}`;
});

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function maxReservationDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function ReservationForm() {
  const supabase = useMemo(() => createClient(), []);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState("");
  const [booked, setBooked] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "ok" | "error"; text: string} | null>(null);

  async function loadBooked(selectedDate: string) {
    setLoadingSlots(true);
    setTime("");
    const { data, error } = await supabase.rpc("get_booked_slots", {
      selected_date: selectedDate,
    });
    setBooked(error ? [] : (data ?? []).map((row: { saat: string }) => row.saat));
    setLoadingSlots(false);
  }

  useEffect(() => {
    loadBooked(date);
  }, [date]);

  function openCalendar() {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  }

  async function submit(formData: FormData) {
    setSaving(true);
    setMessage(null);

    if (!time) {
      setMessage({ type: "error", text: "Lütfen bir saat seçin." });
      setSaving(false);
      return;
    }

    const payload = {
      ad_soyad: String(formData.get("name") || "").trim(),
      telefon: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim() || null,
      tarih: date,
      saat: time,
      kisi_sayisi: Number(formData.get("people")),
      notlar: String(formData.get("note") || "").trim() || null,
    };

    const { data, error } = await supabase
      .from("rezervasyonlar")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      const friendly = error.code === "23505"
        ? "Bu seans az önce doldu. Lütfen başka bir saat seçin."
        : "Rezervasyon kaydedilemedi. Bilgileri kontrol edip tekrar deneyin.";
      setMessage({ type: "error", text: friendly });
      await loadBooked(date);
    } else {
      setMessage({
        type: "ok",
        text: "Rezervasyon talebiniz alındı. Yönetici onayından sonra sizinle iletişime geçilecektir.",
      });
      void fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "new", reservation: { id: data.id, ...payload } }),
      });
      setTime("");
      (document.getElementById("reservation-form") as HTMLFormElement)?.reset();
      setDate(todayLocal());
      await loadBooked(todayLocal());
    }
    setSaving(false);
  }

  return (
    <form id="reservation-form" className="reservation-card" action={submit}>
      <div className="form-grid">
        <label><span>Ad Soyad</span><input name="name" required minLength={3} placeholder="Adınız ve soyadınız" /></label>
        <label><span>Telefon</span><input name="phone" required inputMode="tel" placeholder="05xx xxx xx xx" /></label>
        <label><span>E-posta (isteğe bağlı)</span><input name="email" type="email" placeholder="ornek@mail.com" /></label>
        <label>
          <span>Kişi Sayısı</span>
          <select name="people" defaultValue="2" required>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} kişi</option>)}
          </select>
        </label>
        <label className="full date-field">
          <span>Tarih Seçimi</span>
          <div className="date-picker-wrap" onClick={openCalendar} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openCalendar(); }}>
            <input ref={dateInputRef} type="date" value={date} min={todayLocal()} max={maxReservationDate()} onChange={(e) => setDate(e.target.value)} required aria-label="Rezervasyon tarihi" />
            <button type="button" className="calendar-button" onClick={(e) => { e.stopPropagation(); openCalendar(); }} aria-label="Takvimi aç">📅 Takvimi Aç</button>
          </div>
          <small className="field-help">Geçmiş tarihler kapalıdır. Bugünden itibaren seçim yapabilirsiniz.</small>
        </label>
      </div>

      <div className="slot-area">
        <div className="section-title"><h2>Seans Saati</h2><span>{loadingSlots ? "Kontrol ediliyor..." : "Dolu saatler seçilemez"}</span></div>
        <div className="slots">
          {SESSION_TIMES.map(slot => {
            const isBooked = booked.includes(slot);
            return (
              <button key={slot} type="button" disabled={isBooked || loadingSlots} className={`slot ${time === slot ? "selected" : ""} ${isBooked ? "booked" : ""}`} onClick={() => setTime(slot)}>
                <strong>{slot}</strong><small>{isBooked ? "Dolu" : "Müsait"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <label className="note-field"><span>Not (isteğe bağlı)</span><textarea name="note" rows={3} placeholder="Eklemek istediğiniz bir bilgi..." /></label>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      <button className="btn btn-primary submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Rezervasyonu Tamamla"}</button>
      <p className="privacy-note">Bilgileriniz yalnızca rezervasyon işlemi için kullanılır.</p>
    </form>
  );
}
