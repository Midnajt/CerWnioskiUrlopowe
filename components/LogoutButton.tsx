"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button } from "@/components/ui";

type Props = { name: string };

export function LogoutButton({ name }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button type="button" onClick={handleLogout} disabled={pending}>
      <Glyph name="logout" />
      {pending ? "Wylogowanie…" : `Wyloguj (${name})`}
    </Button>
  );
}
