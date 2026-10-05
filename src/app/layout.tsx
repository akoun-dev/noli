import type { Metadata } from "next";
import { Space_Grotesk, Nunito_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";

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

// FIX-HYDRATION : neutralise les attributs injectés par les extensions navigateur
// (ex. Bing : bis_skin_checked / bis_register / __processed_*__) AVANT l'hydratation
// React. Sans cela, React signale un mismatch SSR/CSR et l'overlay dev s'affiche,
// alors même que l'application est saine. Exécuté en tout premier dans <body>.
const EXTENSION_CLEANUP_SCRIPT = `
(function () {
  var ATTRS = ['bis_skin_checked', 'bis_register', 'bis_size', '__processed_892927d4-0bdc-49d3-80f8-ceee38665a7d__'];
  function strip(el) {
    if (!el || el.nodeType !== 1 || !el.removeAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) {
      if (el.hasAttribute(ATTRS[i])) el.removeAttribute(ATTRS[i]);
    }
  }
  try {
    var observer = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var mutation = mutations[m];
        if (mutation.type === 'attributes') strip(mutation.target);
        if (mutation.addedNodes) {
          for (var n = 0; n < mutation.addedNodes.length; n++) {
            strip(mutation.addedNodes[n]);
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ATTRS,
    });
    // On arrête l'observation après l'hydratation (extinction propre, zéro overhead).
    window.addEventListener('load', function () {
      setTimeout(function () { observer.disconnect(); }, 5000);
    });
  } catch (e) {
    /* environnement sans MutationObserver : no-op silencieux */
  }
})();
`;

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
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${nunitoSans.variable} ${poppins.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: EXTENSION_CLEANUP_SCRIPT }} />
        {/* UI-H01 : lien skip-nav, invisible sauf au focus clavier (WCAG 2.1 A) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            {/* UI-H03 : Error Boundary racine — plus d'écran blanc en cas d'erreur */}
            <ErrorBoundary label="Application">
              {children}
              <Toaster />
            </ErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
