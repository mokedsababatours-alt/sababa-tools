// app/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans_Hebrew, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/lib/auth";

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-hebrew",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sababa Tools",
  description: "כלי פורטל - כלים פנימיים",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authSession = await auth();

  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${notoHebrew.variable} ${playfair.variable} font-hebrew antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen flex flex-col bg-[var(--bg-base)]">
            <AppHeader session={authSession} />
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
