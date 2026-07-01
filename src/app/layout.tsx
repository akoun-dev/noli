import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NOLI Assurance - Comparez les Meilleures Assurances Auto en Côte d'Ivoire",
  description:
    "NOLI Assurance vous permet de comparer les offres d'assurance automobile de plusieurs assureurs en Côte d'Ivoire. Obtenez des devis gratuits en 3 minutes.",
  keywords: [
    "assurance",
    "assurance auto",
    "Côte d'Ivoire",
    "Abidjan",
    "comparateur assurance",
    "devis assurance",
    "NOLI",
    "assurance automobile",
  ],
  authors: [{ name: "NOLI Assurance" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "NOLI Assurance - Comparez les Assurances Auto",
    description:
      "Plateforme de comparaison d'assurances automobiles en Côte d'Ivoire",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}