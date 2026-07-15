import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Sans, Yellowtail } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const yellowtail = Yellowtail({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yellowtail",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const DESCRIPCION =
  "Viaje para dos personas + $500.000 de viáticos. Boleta a $60.000. " +
  "Escoge tu número del 00 al 99. Juega el sábado 17 de octubre de 2026 con la Lotería de Boyacá.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://rifa.fly.dev"),
  title: "Viaja por Colombia — Rifa · Gánate un viaje para 2",
  description: DESCRIPCION,
  openGraph: {
    title: "Viaja por Colombia — Rifa",
    description: DESCRIPCION,
    siteName: "Viaja por Colombia",
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#101f3c",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${anton.variable} ${yellowtail.variable} ${instrument.variable}`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
