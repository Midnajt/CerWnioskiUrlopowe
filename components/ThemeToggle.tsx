"use client";

import { Glyph } from "@/components/glyphs";
import { useThemeMode } from "@/components/theme-mode";
import { Button } from "@/components/ui";

type Props = { iconOnly?: boolean };

export function ThemeToggle({ iconOnly = false }: Props) {
  const { mode, toggle } = useThemeMode();
  const dark = mode === "dark";
  const label = dark ? "Jasny motyw" : "Ciemny motyw";

  function handleToggle() {
    toggle();
  }

  return (
    <Button type="button" onClick={handleToggle} aria-pressed={dark} aria-label={label}>
      <Glyph name={dark ? "sun" : "moon"} />
      {iconOnly ? null : label}
    </Button>
  );
}
