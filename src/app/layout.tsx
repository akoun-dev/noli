import type { Metadata } from "next";
import { Space_Grotesk, Nunito_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NOLI Assurance - Comparez les Assurances en Côte d'Ivoire",
  description:
    "NOLI Assurance : comparez les offres d'assurance automobile et trouvez le meilleur tarif en Côte d'Ivoire.",
  keywords: [
    "assurance",
    "assurance auto",
    "Côte d'Ivoire",
    "Abidjan",
    "comparateur",
    "NOLI",
    "devis assurance",
  ],
  authors: [{ name: "NOLI Assurance" }],
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
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
        className={`${spaceGrotesk.variable} ${nunitoSans.variable} ${poppins.variable} antialiased`}
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