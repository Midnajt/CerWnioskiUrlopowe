"use client";

import { CardTitle, TitleIcon } from "@/components/ui";
import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiBell,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiClock,
  FiCornerUpLeft,
  FiEdit3,
  FiFileText,
  FiFilter,
  FiLogIn,
  FiLogOut,
  FiMoon,
  FiMoreVertical,
  FiPlusCircle,
  FiRepeat,
  FiSave,
  FiSend,
  FiSun,
  FiUsers,
  FiX,
} from "react-icons/fi";

const glyphs = {
  limits: FiClock,
  today: FiSun,
  upcoming: FiCalendar,
  conflict: FiAlertTriangle,
  swap: FiRepeat,
  tasks: FiClipboard,
  bell: FiBell,
  list: FiFileText,
  people: FiUsers,
  calendar: FiCalendar,
  form: FiEdit3,
  history: FiClock,
  login: FiLogIn,
  logout: FiLogOut,
  menu: FiMoreVertical,
  moon: FiMoon,
  sun: FiSun,
  plus: FiPlusCircle,
  check: FiCheck,
  close: FiX,
  back: FiCornerUpLeft,
  save: FiSave,
  send: FiSend,
  filter: FiFilter,
  prev: FiChevronLeft,
  next: FiChevronRight,
} as const satisfies Record<string, IconType>;

export type GlyphName = keyof typeof glyphs;

type Props = { name: GlyphName; size?: number };

export function Glyph({ name, size = 20 }: Props) {
  const Icon = glyphs[name];
  return <Icon size={size} aria-hidden />;
}

type HeadingProps = { name: GlyphName; children: React.ReactNode };

export function CardHeading({ name, children }: HeadingProps) {
  return (
    <CardTitle>
      <TitleIcon>
        <Glyph name={name} />
      </TitleIcon>
      {children}
    </CardTitle>
  );
}
