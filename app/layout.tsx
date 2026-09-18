import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "密碼健檢｜本機密碼安全檢查",
  description: "在瀏覽器本機檢查密碼強度，自訂長度、大小寫、數字、特殊符號與常見密碼規則，不傳送或保存資料。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
