import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;
  const title = "Goodie｜品牌客製商品・企業禮贈品・活動周邊";
  const description = "Goodie 專注品牌客製商品、企業禮贈品、活動周邊及聯名商品開發，提供商品提案、材質與工藝評估、打樣、生產、品質控管、包裝及配送的一站式專案服務。";
  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: "/" },
    icons: {
      icon: [
        { url: "/favicon.png", type: "image/png", sizes: "96x96" },
        { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
        { url: "/favicon-512x512.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    },
    openGraph: {
      title,
      description,
      url: origin,
      siteName: "Goodie",
      locale: "zh_TW",
      type: "website",
      images: [`${origin}/og.png`],
    },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.goodie-tw.com/#website",
        url: "https://www.goodie-tw.com/",
        name: "Goodie",
        inLanguage: "zh-Hant",
      },
      {
        "@type": "Organization",
        "@id": "https://www.goodie-tw.com/#organization",
        name: "Goodie",
        legalName: "KLIX INTERNATIONAL CO., LTD.",
        url: "https://www.goodie-tw.com/",
        logo: "https://www.goodie-tw.com/favicon-512x512.png",
        email: "shirley.chen@klixtw.com",
        telephone: "+886-2-77137118",
      },
    ],
  };

  return (
    <html lang="zh-Hant">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
