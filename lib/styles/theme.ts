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

// Jasny pulpit: szare karty i niebieski obrys, poza dwunastoma próbkami.
const lightChrome = {
  page: "#FFFFFF",
  card: "#F3F4F6",
  line: "#DEE2E6",
  blue: "#0D6EFD",
  tile: "#FFFFFF",
};

const fonts = {
  body: '"Segoe UI", "Helvetica Neue", sans-serif',
};

// Mgła belki powitania, te same barwy co ruchome tło na stronie RAKS.
export const hero = {
  background:
    "radial-gradient(125% 75% at 50% 108%, rgb(96 126 224 / 40%) 0%, rgb(96 126 224 / 0%) 55%), linear-gradient(#091334 0%, #0c1a48 15%, #142a6a 38%, #1f3f97 62%, #2b4dac 84%, #3d59b8 100%)",
  base: "#080E2E",
  lowlight: "#080E2E",
  midtone: "#0F1D6E",
  highlight: "#2038BE",
};

const mark = "#D92D59";

export type ThemeMode = "light" | "dark";

function buildTheme(mode: ThemeMode) {
  const dark = mode === "dark";
    return {
    mode,
    colors,
    fonts,
    hero,
    mark,
    // Ciemny motyw zostaje przy dwunastu próbkach. Jasny dostaje szarość i niebieski.
    surface: {
      page: dark ? colors.green950 : lightChrome.page,
      card: dark ? colors.green900 : lightChrome.card,
      raised: dark ? colors.green800 : colors.cream,
      text: dark ? colors.cream : colors.ink,
      muted: dark ? colors.teal500 : colors.green800,
      border: dark ? colors.teal500 : lightChrome.line,
      cardBorder: dark ? colors.teal500 : lightChrome.blue,
      link: dark ? colors.cyan : lightChrome.blue,
      icon: dark ? colors.cyan : lightChrome.blue,
      input: dark ? colors.green800 : colors.white,
      tile: dark ? colors.green800 : lightChrome.tile,
      headerFrost: dark ? "rgb(17 40 14 / 85%)" : "rgb(255 255 255 / 85%)",
      headerLine: "rgb(255 255 255 / 55%)",
      headerShadow: "0 8px 24px rgb(7 8 3 / 12%)",
      menuGlass: "rgb(255 255 255 / 18%)",
      menuGlassLine: "rgb(255 255 255 / 50%)",
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
