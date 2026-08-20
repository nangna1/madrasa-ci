import type { Metadata } from "next";
import { Lora, Noto_Naskh_Arabic } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import { getLocale } from "@/lib/i18n/server";
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
  title: "Scolaris",
  description: "Gestion scolaire pour écoles et fédérations d'écoles de Côte d'Ivoire",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${lora.variable} ${notoNaskhArabic.variable} h-full antialiased`}
      style={{ ["--font-body" as string]: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
    >
      <body className={`min-h-full flex flex-col ${locale === "ar" ? "font-arabic" : "font-sans"}`}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
