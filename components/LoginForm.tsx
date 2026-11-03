"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button, Input, Notice, StackField } from "@/components/ui";

type Props = { initialError: string | null };

export function LoginForm({ initialError }: Props) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "Nie udało się zalogować.");
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <Notice $tone="danger">{error}</Notice> : null}
      <StackField>
        E-mail
        <Input name="email" type="email" autoComplete="username" required />
      </StackField>
      <StackField>
        Hasło
        <Input name="password" type="password" autoComplete="current-password" required />
      </StackField>
      <Button type="submit" $tone="ok" disabled={pending}>
        <Glyph name="login" />
        {pending ? "Logowanie…" : "Zaloguj"}
      </Button>
    </form>
  );
}
