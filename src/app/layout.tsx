import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royalty Funeral Services - Admin Dashboard",
  description: "Funeral services management system for Royalty Funeral Services",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
