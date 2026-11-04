import type { Metadata } from "next";
import { AppTheme } from "@/components/AppTheme";
import { StyledComponentsRegistry } from "@/lib/registry";

function siteOrigin(): URL {
  // Adres produkcyjny, nie VERCEL_URL. Adres konkretnego wdrożenia przekierowuje na logowanie Vercel,
  // więc Teams widzi tytuł, a obrazka nie pobiera.
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return new URL(`https://${production}`);
  const vercel = process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  // Adres bezwzględny, bo Messenger i WhatsApp biorą og:image spoza przeglądarki.
  metadataBase: siteOrigin(),
  title: "Cer — wnioski urlopowe",
  description: "Składanie i akceptacja urlopu wypoczynkowego.",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Cer — wnioski urlopowe",
    description: "Składanie i akceptacja urlopu wypoczynkowego.",
    images: [
      {
        url: "/marketing-2.png",
        width: 603,
        height: 529,
        type: "image/png",
        alt: "Wnioski urlopowe",
      },
    ],
  },
};

type Props = { children: React.ReactNode };

export default function RootLayout({ children }: Props) {
  return (
    <html lang="pl">
      <body>
        <StyledComponentsRegistry>
          <AppTheme>{children}</AppTheme>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
