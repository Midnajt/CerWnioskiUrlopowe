"use client";

import { useState } from "react";
import styled from "styled-components";
import { Glyph } from "@/components/glyphs";
import { formatSlashDate, parseIsoDate, parseSlashDate } from "@/lib/leave/dates";

type Props = {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  required?: boolean;
};

// Kalendarz systemowy maluje miesiąc/dzień według Windows. Tu widać zawsze dzień/miesiąc/rok.
export function DateField({ value, onChange, min, required }: Props) {
  const shown = formatSlashDate(value);
  const [text, setText] = useState(shown);
  const [source, setSource] = useState(value);
  if (value !== source) {
    setSource(value);
    setText(shown);
  }

  function commit(next: string) {
    setText(next);
    if (next === "") {
      if (value) onChange("");
      return;
    }
    const iso = parseSlashDate(next);
    if (!iso || (min && iso < min)) return;
    if (iso !== value) onChange(iso);
  }

  function handleText(raw: string) {
    const next = displayFromRaw(raw, text);
    const iso = parseSlashDate(next);
    if (iso && min && iso < min) {
      setText(shown);
      return;
    }
    commit(next);
  }

  function handleBlur() {
    const iso = parseSlashDate(text);
    if (!iso || (min && iso < min)) setText(shown);
    else setText(formatSlashDate(iso));
  }

  function handlePicked(next: string) {
    if (!parseIsoDate(next)) return;
    if (min && next < min) return;
    onChange(next);
  }

  return (
    <Shell>
      <Text
        value={text}
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/rrrr"
        maxLength={10}
        required={required}
        aria-invalid={text.length > 0 && parseSlashDate(text) === null}
        onChange={(event) => handleText(event.target.value)}
        onBlur={handleBlur}
      />
      <IconSlot>
        <Glyph name="calendar" size={18} />
        <Picker
          type="date"
          tabIndex={-1}
          aria-label="Otwórz kalendarz"
          value={value}
          min={min}
          onChange={(event) => handlePicked(event.target.value)}
        />
      </IconSlot>
    </Shell>
  );
}

function displayFromRaw(raw: string, previous: string): string {
  const iso = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso && parseIsoDate(`${iso[1]}-${iso[2]}-${iso[3]}`)) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }
  const written = raw.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (written) {
    const day = written[1].padStart(2, "0");
    const month = written[2].padStart(2, "0");
    if (parseIsoDate(`${written[3]}-${month}-${day}`)) return `${day}/${month}/${written[3]}`;
  }
  return maskSlash(raw, previous);
}

function maskSlash(raw: string, previous: string): string {
  const cleaned = raw.replace(/[^\d/]/g, "").slice(0, 10);
  if (cleaned.length < previous.length) return cleaned;
  const digits = cleaned.replace(/\D/g, "").slice(0, 8);
  let out = "";
  for (let index = 0; index < digits.length; index += 1) {
    if (index === 2 || index === 4) out += "/";
    out += digits[index];
  }
  if ((digits.length === 2 || digits.length === 4) && cleaned.endsWith("/")) out += "/";
  return out;
}

const Shell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  border-radius: 8px;
  border: 1.5px solid ${({ theme }) => theme.surface.border};
  background: ${({ theme }) => theme.surface.input};
  &:focus-within {
    outline: 2px solid ${({ theme }) => (theme.mode === "dark" ? theme.colors.teal500 : theme.colors.cyan)};
    outline-offset: 2px;
  }
`;

const Text = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.surface.text};
  padding: 8px 10px;
  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

const IconSlot = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 38px;
  align-self: stretch;
  color: ${({ theme }) => theme.surface.icon};
`;

const Picker = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;
