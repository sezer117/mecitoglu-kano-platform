import ReservationForm from "@/components/ReservationForm";

const backgrounds = [
  "/kano/kano-1.jpg",
  "/kano/kano-2.jpg",
  "/kano/kano-3.jpg",
  "/kano/kano-4.jpg",
  "/kano/kano-5.jpg",
];

export default function ReservationPage() {
  return (
    <main className="reservation-scene">
      <div className="reservation-backgrounds" aria-hidden="true">
        {backgrounds.map((src, index) => (
          <div
            key={src}
            className="reservation-background"
            style={{ backgroundImage: `url(${src})`, animationDelay: `${index * 7}s` }}
          />
        ))}
      </div>
      <div className="reservation-shade" aria-hidden="true" />
      <div className="reservation-content">
        <section className="page-heading reservation-heading">
          <p className="eyebrow">ADANA KANO KEYFİ</p>
          <h1>Rezervasyon Oluştur</h1>
          <p>Uygun günü ve saati seçerek kaydını tamamla.</p>
        </section>
        <ReservationForm />
      </div>
    </main>
  );
}
