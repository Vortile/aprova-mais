import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { teacher, whatsappUrl, instagramUrl } from "@/lib/teacher";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const siteUrl = "https://aprovamais.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aprova+ | Aulas Particulares em Manaus — Ciências e Letras",
    template: "%s | Aprova+",
  },
  description:
    "Aulas particulares presenciais em Manaus de Português, Matemática, Física e Química para o Ensino Fundamental e Médio. Aulas com profissionais formados especialistas, atendimento a domicílio. Primeira aula grátis.",
  keywords: [
    "aulas particulares Manaus",
    "professor particular Manaus",
    "reforço escolar Manaus",
    "aulas de física Manaus",
    "aulas de matemática Manaus",
    "aulas de português Manaus",
    "aulas de química Manaus",
    "aulas a domicílio Manaus",
    "professores particulares Manaus",
    "reforço Ensino Médio Manaus",
    "reforço Ensino Fundamental Manaus",
    "vestibular Manaus",
    "Aprova+",
    "aprovamais",
  ],
  authors: [{ name: "Deuticilam Gomes Maia Júnior" }],
  creator: "Deuticilam Gomes Maia Júnior",
  publisher: "Aprova+",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Aprova+",
    title:
      "Aprova+ | Aulas Particulares em Manaus — Português, Matemática, Física e Química",
    description:
      "Aulas particulares presenciais em Manaus de Português, Matemática, Física e Química. Aulas com profissionais formados especialistas, atendimento a domicílio. Primeira aula grátis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aprova+ — Aulas Particulares em Manaus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aprova+ | Aulas Particulares em Manaus",
    description:
      "Português, Matemática, Física e Química a domicílio em Manaus. Primeira aula grátis.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "COLE_SEU_CÓDIGO_AQUI",  // ← descomente e cole o código do Google Search Console
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": siteUrl,
  name: "Aprova+",
  description:
    "Aulas particulares presenciais de Física, Matemática e Inglês em Manaus, AM. Atendimento a domicílio para Ensino Fundamental e Médio.",
  url: siteUrl,
  telephone: `+${teacher.whatsappNumber}`,
  email: "",
  founder: {
    "@type": "Person",
    name: "Deuticilam Gomes Maia Júnior",
    jobTitle: "Professor Particular",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Manaus",
    addressRegion: "AM",
    addressCountry: "BR",
  },
  areaServed: {
    "@type": "City",
    name: "Manaus",
  },
  knowsAbout: [
    "Física",
    "Matemática",
    "Inglês",
    "Ensino Fundamental",
    "Ensino Médio",
  ],
  priceRange: "R$650 – R$1.300/mês",
  openingHours: "Mo-Sa 07:00-21:00",
  sameAs: [instagramUrl, whatsappUrl],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`scroll-smooth ${manrope.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
        {children}
      </body>
    </html>
  );
}
