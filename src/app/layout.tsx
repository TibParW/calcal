import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "calCal - AI Calorie Calculator",
  description: "ถ่ายรูปอาหารแล้วประเมินแคลอรีทันทีด้วย AI บันทึกยอดอัตโนมัติประจำวัน",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "calCal",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-[#fafaf9] dark:bg-[#0c0c0e] text-neutral-900 dark:text-neutral-100 flex flex-col selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900">
        {children}
      </body>
    </html>
  );
}
