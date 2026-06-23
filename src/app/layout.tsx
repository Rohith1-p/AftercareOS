import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AftercareOS — Stop 1-Star Aftercare Reviews Before They Happen",
  description:
    "AI-powered aftercare automation for medical aesthetics, med spas, and studios. Timed, procedure-specific SMS journeys that protect your reviews.",
  metadataBase: new URL("https://aftercareos.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans app-texture">{children}</body>
    </html>
  );
}
