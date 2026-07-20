import Link from "next/link";

export default function Home() {
  return (
    <main className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="brand-mark">M</div>
        <p className="eyebrow">MECİTOĞLU GRUP</p>
        <h1>Adana Kano Keyfi</h1>
        <p className="lead">
          Tarihini ve saatini seç, rezervasyonunu birkaç adımda tamamla.
        </p>
        <div className="actions">
          <Link className="btn btn-primary" href="/rezervasyon">Rezervasyon Yap</Link>
          <Link className="btn btn-secondary" href="/admin/login">Yönetici Girişi</Link>
        </div>
      </div>
    </main>
  );
}
