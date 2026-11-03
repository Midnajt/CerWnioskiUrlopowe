export const colors = {
  ink: "#070803",
  green950: "#11280E",
  green900: "#152F24",
  green800: "#263E2E",
  green700: "#30652F",
  teal800: "#2A6B71",
  teal500: "#57A49E",
  cyan: "#6AE6E4",
  green500: "#31B964",
  cream: "#EFF6C2",
  accent: "#B8462B",
  white: "#F9F9F9",
};

const fonts = {
  body: '"Segoe UI", "Helvetica Neue", sans-serif',
};

export type ThemeMode = "light" | "dark";

function buildTheme(mode: ThemeMode) {
  const dark = mode === "dark";
  return {
    mode,
    colors,
    fonts,
    // Te same hexy. Ciemny motyw zamienia tylko rolę tła, tekstu i kreski.
    surface: {
      page: dark ? colors.green950 : colors.white,
      card: dark ? colors.green900 : colors.white,
      raised: dark ? colors.green800 : colors.cream,
      text: dark ? colors.cream : colors.ink,
      muted: dark ? colors.teal500 : colors.green800,
      border: dark ? colors.teal500 : colors.teal800,
      link: dark ? colors.cyan : colors.teal800,
      icon: dark ? colors.cyan : colors.teal800,
      input: dark ? colors.green800 : colors.white,
    },
  };
}

export const lightTheme = buildTheme("light");
export const darkTheme = buildTheme("dark");
export const themes: Record<ThemeMode, typeof lightTheme> = {
  light: lightTheme,
  dark: darkTheme,
};

export const theme = lightTheme;
