import type { Metadata } from "next";
import { AppTheme } from "@/components/AppTheme";
import { StyledComponentsRegistry } from "@/lib/registry";

function siteOrigin(): URL {
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
        url: "/og.png",
        width: 1254,
        height: 1254,
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
