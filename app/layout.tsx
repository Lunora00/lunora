import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { DM_Sans } from "next/font/google";
import PosthogProvider from "../lib/PosthogProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lunora Ai",
  description: "Learn it -> Quiz it -> Master it",
  icons: {
    icon: "/Lunora.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <head>
        {/* Preconnect stays unchanged */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MC14D44PWG"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MC14D44PWG');
          `}
        </Script>

        {/* PostHog init */}
        <PosthogProvider />

        {children}
      </body>
    </html>
  );
}
