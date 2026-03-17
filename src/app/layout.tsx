import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";
import { IntlProvider } from "@/components/providers/intl-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViciVidi AI - B2B Sales Intelligence Platform",
  description: "AI-powered B2B sales intelligence platform. Find qualified leads, enrich company data, and verify email contacts. Powered by Caesar Engine.",
  keywords: ["B2B", "sales intelligence", "lead generation", "email verification", "company data", "ViciVidi", "Caesar Engine"],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

const locales = ['en', 'zh'] as const;
const defaultLocale = 'en';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('locale')?.value as typeof locales[number]) || defaultLocale;
  
  const messages = (await import(`../i18n/messages/${locale}.json`)).default;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <IntlProvider locale={locale} messages={messages}>
          {children}
          <Toaster />
        </IntlProvider>
      </body>
    </html>
  );
}