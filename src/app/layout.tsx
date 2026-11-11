import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/index.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://axddigitallab.com"),
  title: "AXD DIGITAL LAB — Premium Digital Services | WhatsApp Bots, Web Dev, Shopify, Design & AI Tools",
  description:
    "AXD DIGITAL LAB — Pakistan's #1 digital studio. WhatsApp bots, modern websites, Shopify stores, branding, marketing & AI automation. Fast delivery, 24/7 support, affordable pricing. Order on WhatsApp today!",
  keywords:
    "AXD DIGITAL LAB, AXD Digital Lab Pakistan, WhatsApp bot Pakistan, web development Pakistan, Shopify store setup, graphic design, digital marketing agency, AI automation, best digital services Pakistan",
  authors: [{ name: "AXD DIGITAL LAB" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  alternates: { canonical: "https://axddigitallab.com/" },
  verification: { google: "vmPSg_iAwTqMFDmtLvszQ7GY83zsx-FD-uJVtPY1ADE" },
  openGraph: {
    title: "AXD DIGITAL LAB — Premium Digital Services | WhatsApp Bots, Web Dev, Shopify, Design & AI Tools",
    description:
      "AXD DIGITAL LAB — Pakistan's premium digital studio. WhatsApp automation, high-converting websites, Shopify stores, branding, marketing & AI tools. Trusted by 10K+ clients.",
    type: "website",
    url: "https://axddigitallab.com/",
    siteName: "AXD DIGITAL LAB",
    images: [{ url: "/images/cyber-lab-hero.jpg", width: 2048, height: 1152 }],
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: "AXD DIGITAL LAB — Premium Digital Services",
    description: "WhatsApp bots, modern websites, Shopify, branding, marketing & AI automation — fast, premium, affordable. Chat on WhatsApp now!",
    images: ["/images/cyber-lab-hero.jpg"],
    site: "@axddigitallab",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='24' y1='2' x2='24' y2='46' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%237CFFC0'/%3E%3Cstop offset='.45' stop-color='%2322E07C'/%3E%3Cstop offset='1' stop-color='%230F9B52'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='48' height='48' rx='12' fill='%23050B08'/%3E%3Cpath fill='url(%23g)' d='M24 6.4a2.1 2.1 0 0 1 1.8 1.03l17.4 31.1a2.1 2.1 0 0 1-1.8 3.15h-8.9a2.1 2.1 0 0 1-1.9-1.17L24 24.9l-6.6 15.6a2.1 2.1 0 0 1-1.9 1.17H6.6a2.1 2.1 0 0 1-1.8-3.15L22.2 7.43A2.1 2.1 0 0 1 24 6.4Z'/%3E%3Cpath fill='url(%23g)' d='M16.4 30.2h15.2a1.95 1.95 0 0 1 0 3.9H16.4a1.95 1.95 0 0 1 0-3.9Z'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030504",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
