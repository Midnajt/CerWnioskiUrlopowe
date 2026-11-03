"use client";

import { ThemeProvider } from "styled-components";
import { ThemeModeProvider, useThemeMode } from "@/components/theme-mode";
import { GlobalStyle } from "@/lib/styles/GlobalStyle";
import { themes } from "@/lib/styles/theme";

type Props = { children: React.ReactNode };

function Themed({ children }: Props) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={themes[mode]}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  );
}

export function AppTheme({ children }: Props) {
  return (
    <ThemeModeProvider>
      <Themed>{children}</Themed>
    </ThemeModeProvider>
  );
}
