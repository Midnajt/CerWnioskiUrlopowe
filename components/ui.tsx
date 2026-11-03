"use client";

import Link from "next/link";
import styled, { css } from "styled-components";

export const Frame = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 20px 48px;
`;

export const TopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid ${({ theme }) => theme.surface.border};
`;

export const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Brand = styled.p`
  margin: 0;
  font-weight: 700;
`;

export const Welcome = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  padding: 20px 24px;
  border-radius: 16px;
  color: ${({ theme }) => theme.colors.white};
  p { margin: 0; }
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.green900},
    ${({ theme }) => theme.colors.green700}
  );
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
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.white};
  flex: none;
`;

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
`;

const tileTones = ["accent", "teal800", "green700", "teal500", "green800"] as const;

export const Tile = styled(Link)<{ $index: number }>`
  min-height: 140px;
  padding: 14px;
  border-radius: 16px;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ $index, theme }) => theme.colors[tileTones[$index % tileTones.length]]};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  border: 2px solid ${({ theme }) => theme.surface.border};
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
  background: ${({ theme }) => theme.colors.accent};
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
  accent-color: ${({ theme }) => theme.colors.green700};
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
    return $tone === "danger" ? theme.colors.accent : theme.colors.teal800;
  }};
  color: ${({ $fill, $tone, theme }) => {
    if ($fill) return theme.colors.white;
    if ($tone === "ok") return theme.colors.green500;
    if ($tone === "danger") return theme.colors.accent;
    return theme.surface.link;
  }};
  border: 1.5px solid
    ${({ $tone, theme }) => {
      if ($tone === "ok") return theme.colors.green500;
      if ($tone === "danger") return theme.colors.accent;
      return theme.surface.border;
    }};
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
`;

export const TextLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.surface.link};
  font-weight: 600;
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
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.colors.cream};
  color: ${({ $tone, theme }) => ($tone === "ok" ? theme.colors.green700 : theme.colors.accent)};
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
  border: 2px solid ${({ theme }) => theme.surface.border};
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
    background: ${({ theme }) => theme.colors.teal800};
    color: ${({ theme }) => theme.colors.white};
    border-radius: 8px;
    padding: 8px 14px;
  }
  summary::-webkit-details-marker {
    display: none;
  }
`;
