import type { Metadata } from "next";
import Navbar from "@/components/Layouts/Navbar";
import Footer from "@/components/Layouts/Footer";
import Chatbot from "@/components/Chatbot";
import TrackerAlert from "@/components/TrackerAlert";
import CMSRealtimeProvider from "@/components/CMSRealtimeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Inferno Group LLC | Government Consulting & Emergency Management Services",
  description: "The Inferno Group LLC is a premier government consulting firm specializing in Emergency Management, disaster recovery, public & individual assistance, SAM.gov registration, and strategic business development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Body/html presentation stays in globals.css. These carried Tailwind
          sizing classes (h-full / min-h-full / flex flex-col) that were inert
          while Tailwind was unwired; leaving them would switch body to flex and
          move the footer on short pages, so they are intentionally omitted. */}
      <body>
        <CMSRealtimeProvider />
        {/* BACKGROUND OVERLAYS */}
        <div className="grid-bg"></div>
        <div className="glow-spotlight spotlight-1"></div>
        <div className="glow-spotlight spotlight-2"></div>

        <TrackerAlert />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Chatbot />
      </body>
    </html>
  );
}
