import type { Metadata } from "next";
import { AppTheme } from "@/components/AppTheme";
import { StyledComponentsRegistry } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Cer — wnioski urlopowe",
  description: "Składanie i akceptacja urlopu wypoczynkowego.",
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
