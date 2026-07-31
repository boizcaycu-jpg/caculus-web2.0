import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phòng Luyện TSA",
  description: "Phòng Luyện Mô Phỏng TSA - Hệ thống Khảo thí Đánh giá Tư duy Bách Khoa CACULUS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="bg-slate-50 text-slate-900 text-base min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
