import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adana Kano Keyfi | Mecitoğlu Grup",
  description: "Adana Kano Keyfi için güvenli ve hızlı online rezervasyon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
