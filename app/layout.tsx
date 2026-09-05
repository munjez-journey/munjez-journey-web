import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://munjez-journey.com"),
  title: "رحلة مُنجِز | وما النجاح إلا إنجازات صغيرة",
  description:
    "رحلة مُنجِز منصة عربية للمقالات والبودكاست والأخبار والأدوات التي تساعدك على تحويل الخطوات الصغيرة إلى إنجازات.",
  icons: {
    icon: "/hourglass-logo.png",
    shortcut: "/hourglass-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
