"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Glyph, type GlyphName } from "@/components/glyphs";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageTransition } from "@/components/PageTransition";
import { Avatar, BarInner, Brand, BrandLogo, Frame, Shell, Tile, TileCount, TileGrid, TileLabel, TopActions, TopBar, Welcome, WelcomeInner, WelcomeTitle } from "@/components/ui";
import { WelcomeFog } from "@/components/WelcomeFog";
import { initials } from "@/lib/leave/labels";
import type { Employee } from "@/lib/types";

type Props = {
  me: Employee;
  taskCount: number;
  showTeam: boolean;
  children: React.ReactNode;
};

// Niebieskie wypełnienie pokazuje otwarty kafelek. Nowy wniosek nie może zapalić listy.
function tileActive(pathname: string, href: string) {
  if (href === "/wnioski") {
    return pathname === "/wnioski" || (pathname.startsWith("/wnioski/") && !pathname.startsWith("/wnioski/nowy"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ me, taskCount, showTeam, children }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const next = window.scrollY > 8;
      setScrolled((current) => (current === next ? current : next));
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tiles: { href: string; label: string; icon: GlyphName; count?: number }[] = [
    { href: "/wnioski/nowy", label: "Utwórz wniosek urlopowy", icon: "plus" },
    { href: "/wnioski", label: "Moje wnioski urlopowe", icon: "list" },
    { href: "/zadania", label: "Moje zadania", icon: "tasks", count: taskCount },
    { href: "/kalendarz", label: showTeam ? "Urlopy zespołu" : "Kalendarz", icon: "calendar" },
  ];
  if (me.isHr) tiles.push({ href: "/pracownicy", label: "Urlopy pracowników", icon: "people" });

  return (
    <Shell>
      <TopBar $scrolled={scrolled}>
        <BarInner>
          <Brand href="/">
            <BrandLogo src="/cm_logo.png" alt="CerMotor" width={32} height={32} />
            Wnioski urlopowe
          </Brand>
          <TopActions $ghost={!scrolled}>
            <ThemeToggle />
            <LogoutButton name={`${me.firstName} ${me.lastName}`} ghost={!scrolled} />
          </TopActions>
        </BarInner>
      </TopBar>
      <Welcome>
        <WelcomeFog />
        <WelcomeInner>
          <div>
            <WelcomeTitle>Cześć {me.firstName}</WelcomeTitle>
            <p>Liczba nowych zadań do wykonania: {taskCount}</p>
          </div>
          <Avatar aria-hidden="true">{initials(me)}</Avatar>
        </WelcomeInner>
      </Welcome>
      <Frame>
        <TileGrid>
          {tiles.map((tile) => (
            <Tile
              key={tile.href}
              href={tile.href}
              $active={tileActive(pathname, tile.href)}
              aria-current={tileActive(pathname, tile.href) ? "page" : undefined}
            >
              <TileLabel>
                <Glyph name={tile.icon} size={28} />
                <span>{tile.label}</span>
              </TileLabel>
              {typeof tile.count === "number" ? <TileCount>{tile.count}</TileCount> : null}
            </Tile>
          ))}
        </TileGrid>
        <PageTransition>{children}</PageTransition>
      </Frame>
    </Shell>
  );
}
