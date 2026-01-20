import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
          {children}
      </body>
    </html>
  );
}