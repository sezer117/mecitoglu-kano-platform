"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SESSION_TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function ReservationForm() {
  const supabase = useMemo(() => createClient(), []);
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

    const { error } = await supabase.from("rezervasyonlar").insert(payload);

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
      setTime("");
      (document.getElementById("reservation-form") as HTMLFormElement)?.reset();
      await loadBooked(date);
    }
    setSaving(false);
  }

  return (
    <form id="reservation-form" className="reservation-card" action={submit}>
      <div className="form-grid">
        <label>
          <span>Ad Soyad</span>
          <input name="name" required minLength={3} placeholder="Adınız ve soyadınız" />
        </label>
        <label>
          <span>Telefon</span>
          <input name="phone" required inputMode="tel" placeholder="05xx xxx xx xx" />
        </label>
        <label>
          <span>E-posta (isteğe bağlı)</span>
          <input name="email" type="email" placeholder="ornek@mail.com" />
        </label>
        <label>
          <span>Kişi Sayısı</span>
          <select name="people" defaultValue="2" required>
            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} kişi</option>)}
          </select>
        </label>
        <label className="full">
          <span>Tarih</span>
          <input
            type="date"
            value={date}
            min={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="slot-area">
        <div className="section-title">
          <h2>Seans Saati</h2>
          <span>{loadingSlots ? "Kontrol ediliyor..." : "Dolu saatler seçilemez"}</span>
        </div>
        <div className="slots">
          {SESSION_TIMES.map(slot => {
            const isBooked = booked.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked || loadingSlots}
                className={`slot ${time === slot ? "selected" : ""} ${isBooked ? "booked" : ""}`}
                onClick={() => setTime(slot)}
              >
                <strong>{slot}</strong>
                <small>{isBooked ? "Dolu" : "Müsait"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <label className="note-field">
        <span>Not (isteğe bağlı)</span>
        <textarea name="note" rows={3} placeholder="Eklemek istediğiniz bir bilgi..." />
      </label>

      {message && <div className={`notice ${message.type}`}>{message.text}</div>}

      <button className="btn btn-primary submit" disabled={saving}>
        {saving ? "Kaydediliyor..." : "Rezervasyonu Tamamla"}
      </button>
      <p className="privacy-note">Bilgileriniz yalnızca rezervasyon işlemi için kullanılır.</p>
    </form>
  );
}
