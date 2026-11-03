"use client";

import { Glyph, type GlyphName } from "@/components/glyphs";
import { LogoutButton } from "@/components/LogoutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, Brand, Frame, Tile, TileCount, TileGrid, TileLabel, TopActions, TopBar, Welcome, WelcomeTitle } from "@/components/ui";
import { initials } from "@/lib/leave/labels";
import type { Employee } from "@/lib/types";

type Props = {
  me: Employee;
  taskCount: number;
  showTeam: boolean;
  children: React.ReactNode;
};

export function AppShell({ me, taskCount, showTeam, children }: Props) {
  const tiles: { href: string; label: string; icon: GlyphName; count?: number }[] = [
    { href: "/wnioski/nowy", label: "Utwórz wniosek urlopowy", icon: "plus" },
    { href: "/wnioski", label: "Moje wnioski urlopowe", icon: "list" },
    { href: "/zadania", label: "Moje zadania", icon: "tasks", count: taskCount },
    { href: "/kalendarz", label: showTeam ? "Urlopy zespołu" : "Kalendarz", icon: "calendar" },
  ];
  if (me.isHr) tiles.push({ href: "/pracownicy", label: "Urlopy pracowników", icon: "people" });

  return (
    <Frame>
      <TopBar>
        <Brand>Wnioski urlopowe</Brand>
        <TopActions>
          <ThemeToggle />
          <LogoutButton name={`${me.firstName} ${me.lastName}`} />
        </TopActions>
      </TopBar>
      <Welcome>
        <div>
          <WelcomeTitle>Cześć {me.firstName}</WelcomeTitle>
          <p>Liczba nowych zadań do wykonania: {taskCount}</p>
        </div>
        <Avatar aria-hidden="true">{initials(me)}</Avatar>
      </Welcome>
      <TileGrid>
        {tiles.map((tile, index) => (
          <Tile key={tile.href} href={tile.href} $index={index}>
            <TileLabel>
              <Glyph name={tile.icon} size={28} />
              <span>{tile.label}</span>
            </TileLabel>
            {typeof tile.count === "number" ? <TileCount>{tile.count}</TileCount> : null}
          </Tile>
        ))}
      </TileGrid>
      {children}
    </Frame>
  );
}
