"use client";

import Link from "next/link";
import styled, { css } from "styled-components";

export const Shell = styled.div`
  --header-h: 72px;
  min-height: 100vh;
`;

export const Frame = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 48px;
`;

export const TopBar = styled.header<{ $scrolled: boolean }>`
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--header-h);
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.white};
  background: transparent;
  border-bottom: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;
  ${({ $scrolled, theme }) =>
    $scrolled &&
    css`
      color: ${theme.surface.text};
      background: ${theme.surface.headerFrost};
      backdrop-filter: blur(14px) saturate(1.8);
      border-bottom-color: ${theme.surface.border};
      box-shadow: ${theme.surface.headerShadow};
    `}
`;

export const BarInner = styled.div`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

export const TopActions = styled.div<{ $ghost?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  ${({ $ghost, theme }) =>
    $ghost
      ? css`
          > button,
          > div > button {
            color: ${theme.colors.white};
            border-color: ${theme.surface.headerLine};
          }
        `
      : theme.mode === "dark"
        ? css`
            > button,
            > div > button {
              color: ${theme.surface.border};
            }
          `
        : ""}
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 700;
  text-decoration: none;
  color: inherit;
`;

export const BrandLogo = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex: none;
  border: none;
  box-shadow: none;
  background: transparent;
`;

export const Welcome = styled.section`
  position: relative;
  z-index: 0;
  overflow: hidden;
  margin: calc(var(--header-h) * -1) 0 16px;
  padding: calc(var(--header-h) + 20px) 0 28px;
  border-radius: 0 0 32px 32px;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.hero.background};
  p { margin: 0; }
`;

export const WelcomeInner = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

export const FogLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
`;

export const WelcomeTitle = styled.h1`
  margin: 0 0 4px;
  font-size: 28px;
`;

export const Avatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  background: ${({ theme }) => theme.mark};
  color: ${({ theme }) => theme.colors.white};
  flex: none;
`;

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

export const Tile = styled(Link)<{ $active?: boolean }>`
  min-height: 140px;
  padding: 14px;
  border-radius: 16px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Tło aktywnego kafelka i obwódka po najechaniu wchodzą, a nie przeskakują. */
  transition: background-color 0.18s ease-out, color 0.18s ease-out, border-color 0.18s ease-out, box-shadow 0.18s ease-out;
  svg {
    transition: color 0.18s ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    svg {
      transition: none;
    }
  }
  ${({ $active, theme }) => css`
    color: ${$active ? theme.colors.white : theme.surface.text};
    background: ${$active ? theme.surface.action : theme.surface.tile};
    border: 1.5px solid ${$active ? theme.surface.action : theme.surface.border};
    svg {
      color: ${$active ? theme.colors.white : theme.surface.icon};
    }
    &:hover {
      background: ${$active ? theme.surface.action : theme.surface.card};
      border-color: ${theme.surface.cardBorder};
    }
  `}
`;

export const TileLabel = styled.span`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TileCount = styled.span`
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
`;

export const Card = styled.section`
  background: ${({ theme }) => theme.surface.card};
  border: 2px solid ${({ theme }) => theme.surface.cardBorder};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 18px;
`;

export const TitleIcon = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.surface.icon};
  flex: none;
`;

export const TableWrap = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid ${({ theme }) => theme.surface.border};
    vertical-align: top;
  }
  th {
    background: ${({ theme }) => theme.surface.raised};
    font-weight: 600;
  }
`;

export const Badge = styled.span`
  display: inline-block;
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.mark};
  color: ${({ theme }) => theme.colors.white};
  font-size: 12px;
  font-weight: 700;
`;

export const StackField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

export const FormRow = styled.label`
  display: grid;
  grid-template-columns: minmax(160px, 240px) 1fr;
  gap: 8px 16px;
  align-items: center;
  margin-bottom: 12px;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const field = css`
  width: 100%;
  min-width: 0;
  border-radius: 8px;
  padding: 8px 10px;
`;

export const Check = styled.input`
  width: 18px;
  height: 18px;
  accent-color: ${({ theme }) => theme.surface.ok};
`;

export const Input = styled.input`
  ${field}
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.surface.input};
  color: ${({ theme }) => theme.surface.text};
`;

export const Select = styled.select`
  ${field}
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.surface.input};
  color: ${({ theme }) => theme.surface.text};
`;

export const TextArea = styled.textarea`
  ${field}
  min-height: 80px;
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.surface.input};
  color: ${({ theme }) => theme.surface.text};
`;

export const Readonly = styled.div`
  background: ${({ theme }) => theme.surface.raised};
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  border-radius: 8px;
  padding: 8px 10px;
`;

export const Button = styled.button<{ $tone?: "ok" | "danger" | "neutral"; $fill?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${({ $fill, $tone, theme }) => {
    if (!$fill) return "transparent";
    if ($tone === "danger") return theme.surface.warn;
    if ($tone === "ok") return theme.surface.ok;
    return theme.surface.action;
  }};
  color: ${({ $fill, $tone, theme }) => {
    if ($fill) return theme.colors.white;
    if ($tone === "ok") return theme.surface.ok;
    if ($tone === "danger") return theme.surface.warn;
    return theme.surface.link;
  }};
  border: 1.5px solid
    ${({ $fill, $tone, theme }) => {
      if ($tone === "ok") return theme.surface.ok;
      if ($tone === "danger") return theme.surface.warn;
      if ($fill) return theme.surface.action;
      return theme.surface.border;
    }};
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
`;

export const UserMenu = styled.div`
  position: relative;
`;

export const UserMenuPanel = styled.div<{ $ghost?: boolean }>`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  width: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: transparent;
  border: none;
  button,
  a {
    width: 100%;
    justify-content: flex-start;
    text-decoration: none;
  }
  ${({ $ghost, theme }) =>
    $ghost
      ? css`
          button,
          a {
            color: ${theme.colors.white};
            background: ${theme.surface.menuGlass};
            border-color: ${theme.surface.menuGlassLine};
            backdrop-filter: blur(14px) saturate(1.6);
          }
        `
      : css`
          button,
          a {
            color: ${theme.mode === "dark" ? theme.surface.border : theme.surface.link};
            background: ${theme.surface.page};
            border-color: ${theme.surface.border};
          }
        `}
`;

export const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 0 12px;
`;

export const TextLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: middle;
  line-height: 1;
  color: ${({ theme }) => theme.surface.link};
  font-weight: 600;
  svg {
    display: block;
    flex: none;
    color: ${({ theme }) => theme.surface.icon};
  }
`;

export const RowActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
`;

export const Notice = styled.p<{ $tone?: "danger" | "ok" }>`
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid ${({ $tone, theme }) => ($tone === "ok" ? theme.surface.ok : theme.surface.warn)};
  background: ${({ $tone, theme }) => ($tone === "ok" ? theme.surface.okWash : theme.surface.warnWash)};
  color: ${({ $tone, theme }) => ($tone === "ok" ? theme.surface.ok : theme.surface.warn)};
`;

export const Muted = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.surface.muted};
`;

export const LoginCard = styled.main`
  max-width: 420px;
  margin: 10vh auto;
  padding: 24px;
  border-radius: 16px;
  background: ${({ theme }) => theme.surface.card};
  border: 2px solid ${({ theme }) => theme.surface.cardBorder};
`;

// Czarny pasek przy dolnej krawędzi ekranu, tylko na stronie logowania.
export const LoginDemo = styled.footer`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 0;
  padding: 10px 16px;
  background: ${({ theme }) => theme.colors.ink};
  color: ${({ theme }) => theme.colors.white};
  text-align: center;
  font-size: 14px;
`;

export const LoginTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px;
  line-height: 1.25;
`;

export const LoginLogo = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: contain;
  flex: none;
`;

export const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin: 12px 0;
`;

export const DayCell = styled.div`
  min-height: 48px;
  padding: 4px;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.surface.raised};
`;

export const FilterDetails = styled.details`
  margin-bottom: 12px;
  summary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    list-style: none;
    background: ${({ theme }) => theme.surface.action};
    color: ${({ theme }) => theme.colors.white};
    border-radius: 8px;
    padding: 8px 14px;
  }
  summary::-webkit-details-marker {
    display: none;
  }
`;
