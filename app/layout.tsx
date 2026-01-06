import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://libreriaescolar.cl/"),
  title: "Librería Escolar | Etiquetas Inteligentes",
  description: "Sistema de recuperación de útiles escolares mediante QR Inteligentes",
  openGraph: {
    title: "Librería Escolar | Etiquetas Inteligentes",
    description: "Recupera tus útiles escolares perdidos con nuestro sistema de etiquetas QR.",
    url: "https://libreriaescolar.cl/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Librería Escolar | Etiquetas Inteligentes",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
