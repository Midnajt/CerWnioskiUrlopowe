"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button, UserMenu, UserMenuPanel } from "@/components/ui";

type Props = { name: string; ghost?: boolean };

export function LogoutButton({ name, ghost = false }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  // Zamyka listę po kliknięciu poza nią i po Escape, bez osobnej biblioteki menu.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleToggle() {
    setOpen((value) => !value);
  }

  return (
    <UserMenu ref={rootRef}>
      <Button type="button" aria-expanded={open} aria-haspopup="menu" onClick={handleToggle}>
        <Glyph name="menu" />
        {name}
      </Button>
      {open ? (
        <UserMenuPanel $ghost={ghost} role="menu">
          <Button type="button" role="menuitem" onClick={handleLogout} disabled={pending}>
            <Glyph name="logout" />
            {pending ? "Wylogowanie…" : "Wyloguj"}
          </Button>
        </UserMenuPanel>
      ) : null}
    </UserMenu>
  );
}
