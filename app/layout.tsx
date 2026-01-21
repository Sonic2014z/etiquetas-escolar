import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Sans_3, Montserrat } from "next/font/google";
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

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://libreriaescolar.cl/"),
  title: "Librería Escolar | Etiquetas Inteligentes",
  description: "Sistema de recuperación de útiles escolares mediante QR Inteligentes",
  icons: {
    icon: [
      { url: '/ISOTIPO-32x32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/ISOTIPO-64x64.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/ISOTIPO.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '192x192', type: 'image/png'},
    ],
  },
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
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSans.variable} ${montserrat.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
