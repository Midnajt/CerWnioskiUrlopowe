"use client";

import { Glyph } from "@/components/glyphs";
import { useThemeMode } from "@/components/theme-mode";
import { Button } from "@/components/ui";

export function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  const dark = mode === "dark";

  function handleToggle() {
    toggle();
  }

  return (
    <Button type="button" onClick={handleToggle} aria-pressed={dark}>
      <Glyph name={dark ? "sun" : "moon"} />
      {dark ? "Jasny motyw" : "Ciemny motyw"}
    </Button>
  );
}
