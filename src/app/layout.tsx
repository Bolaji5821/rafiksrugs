import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Rafik's Rugs — Handwoven Rugs Online",
    template: "%s | Rafik's Rugs",
  },
  description:
    "Browse handwoven rugs at Rafik's Rugs. Shop area rugs, runners, and more with fast shipping and easy returns.",
  icons: {
    icon: "/RafiksRugs.png",
    apple: "/RafiksRugs.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
