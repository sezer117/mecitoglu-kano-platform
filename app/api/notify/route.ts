import { NextResponse } from "next/server";
import { Resend } from "resend";

type ReservationPayload = {
  id?: string;
  ad_soyad: string;
  telefon: string;
  email?: string | null;
  tarih: string;
  saat: string;
  kisi_sayisi: number;
  durum?: string;
  notlar?: string | null;
};

export async function POST(request: Request) {
  try {
    const { type, reservation } = await request.json() as {
      type: "new" | "approved" | "cancelled" | "moved";
      reservation: ReservationPayload;
    };

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!apiKey || !from) {
      return NextResponse.json({ ok: true, skipped: "E-posta ayarları eklenmemiş." });
    }

    const resend = new Resend(apiKey);
    const details = `
      <p><strong>Ad Soyad:</strong> ${reservation.ad_soyad}</p>
      <p><strong>Telefon:</strong> ${reservation.telefon}</p>
      <p><strong>Tarih:</strong> ${reservation.tarih}</p>
      <p><strong>Saat:</strong> ${reservation.saat}</p>
      <p><strong>Kişi:</strong> ${reservation.kisi_sayisi}</p>
      ${reservation.notlar ? `<p><strong>Not:</strong> ${reservation.notlar}</p>` : ""}
    `;

    if (type === "new" && adminEmail) {
      await resend.emails.send({
        from,
        to: adminEmail,
        subject: "Yeni Adana Kano Keyfi rezervasyonu",
        html: `<h2>Yeni rezervasyon talebi</h2>${details}`,
      });
    }

    if (reservation.email && type !== "new") {
      const messages = {
        approved: ["Rezervasyonunuz onaylandı", "Rezervasyonunuz onaylanmıştır."],
        cancelled: ["Rezervasyonunuz iptal edildi", "Rezervasyonunuz iptal edilmiştir."],
        moved: ["Rezervasyon saatiniz güncellendi", "Rezervasyon tarihiniz veya saatiniz güncellenmiştir."],
      } as const;
      const [subject, intro] = messages[type];
      await resend.emails.send({
        from,
        to: reservation.email,
        subject: `Adana Kano Keyfi – ${subject}`,
        html: `<h2>${intro}</h2>${details}<p>Mecitoğlu Grup</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
