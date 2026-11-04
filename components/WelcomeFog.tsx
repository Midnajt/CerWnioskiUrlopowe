"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import { FogLayer } from "@/components/ui";

type FogEffect = { destroy: () => void };

function hexToInt(hex: string) {
  return Number.parseInt(hex.slice(1), 16);
}

export function WelcomeFog() {
  const theme = useTheme();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let cancelled = false;
    let effect: FogEffect | null = null;

    // Ruchoma mgła na kanwie. Gradient z motywu zostaje, gdy przeglądarka nie da WebGL.
    void (async () => {
      const THREE = await import("three");
      const fog = (await import("vanta/dist/vanta.fog.min")) as {
        default: (options: Record<string, unknown>) => FogEffect;
      };
      if (cancelled) return;
      try {
        effect = fog.default({
          el: layer,
          THREE,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 80,
          minWidth: 200,
          highlightColor: hexToInt(theme.hero.highlight),
          midtoneColor: hexToInt(theme.hero.midtone),
          lowlightColor: hexToInt(theme.hero.lowlight),
          baseColor: hexToInt(theme.hero.base),
          blurFactor: 0.6,
          // Trochę szybciej niż 1, żeby ruch mgły był wyraźniejszy na belce.
          speed: 2,
          zoom: 0.8,
          scale: 2,
          scaleMobile: 4,
        });
      } catch {
        effect = null;
      }
    })();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, [theme]);

  return <FogLayer ref={layerRef} aria-hidden />;
}
