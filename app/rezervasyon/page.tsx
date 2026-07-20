import ReservationForm from "@/components/ReservationForm";

export default function ReservationPage() {
  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">ADANA KANO KEYFİ</p>
        <h1>Rezervasyon Oluştur</h1>
        <p>Uygun günü ve saati seçerek kaydını tamamla.</p>
      </section>
      <ReservationForm />
    </main>
  );
}
