import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yapsu Curriculum Management Pipeline",
  description: "Unified 3-Layer Curriculum Management Platform with Localization Overlay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F8F7F5] text-stone-850 font-sans">{children}</body>
    </html>
  );
}
