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

// Jasny pulpit: biel kart na tle łupkowym i niebieski akcent, poza dwunastoma próbkami.
const lightChrome = {
  page: "#F8FAFC",
  card: "#FFFFFF",
  tile: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  blue: "#2563EB",
  green: "#16A34A",
  orange: "#EA580C",
  greenWash: "#F0FDF4",
  orangeWash: "#FFF7ED",
};

// Ciemny pulpit: szarość jak panel Supabase. Seledyn zostaje akcentem, nie tłem.
const darkChrome = {
  page: "#1C1C1C",
  card: "#262626",
  tile: "#262626",
  input: "#262626",
  raised: "#2E2E2E",
  text: "#F5F5F5",
  muted: "#A3A3A3",
  line: "#32D6D1",
  // Spokojna kreska kafelka, blisko szarości strony i płytki, bez turkusu.
  tileLine: "#3A3A3A",
  headerFrost: "rgb(28 28 28 / 85%)",
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

// Poświata obwódki awatara. Tło koła bierze szkło menu z surface.menuGlass.
const markAvatar = {
  glow: "rgb(217 45 89 / 90%)",
  glowWide: "rgb(217 45 89 / 48%)",
};

export type ThemeMode = "light" | "dark";

function buildTheme(mode: ThemeMode) {
  const dark = mode === "dark";
  return {
    mode,
    colors,
    fonts,
    hero,
    mark,
    markAvatar,
    // Ciemny pulpit bierze szarości z darkChrome. Ikona jest turkusem kreski, obwódka karty i link zostają przy teal500.
    surface: {
      page: dark ? darkChrome.page : lightChrome.page,
      card: dark ? darkChrome.card : lightChrome.card,
      raised: dark ? darkChrome.raised : lightChrome.page,
      text: dark ? darkChrome.text : lightChrome.text,
      muted: dark ? darkChrome.muted : lightChrome.muted,
      border: dark ? darkChrome.line : lightChrome.line,
      cardBorder: dark ? colors.teal500 : lightChrome.blue,
      link: dark ? colors.teal500 : lightChrome.blue,
      icon: dark ? darkChrome.line : lightChrome.blue,
      input: dark ? darkChrome.input : lightChrome.card,
      tile: dark ? darkChrome.tile : lightChrome.tile,
      tileBorder: dark ? darkChrome.tileLine : lightChrome.line,
      tileActive: dark ? darkChrome.line : lightChrome.blue,
      ok: dark ? colors.green500 : lightChrome.green,
      warn: dark ? colors.accent : lightChrome.orange,
      okWash: dark ? darkChrome.raised : lightChrome.greenWash,
      warnWash: dark ? darkChrome.raised : lightChrome.orangeWash,
      action: dark ? colors.teal800 : lightChrome.blue,
      headerFrost: dark ? darkChrome.headerFrost : "rgb(255 255 255 / 85%)",
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
