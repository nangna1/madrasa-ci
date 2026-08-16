import type { Metadata } from "next";
import { Lora, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Madrasa CI",
  description: "Gestion des écoles coraniques et médersas de Côte d'Ivoire",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${lora.variable} ${notoNaskhArabic.variable} h-full antialiased`}
      style={{ ["--font-body" as string]: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
