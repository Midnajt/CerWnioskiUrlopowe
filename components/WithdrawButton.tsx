"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button, Notice } from "@/components/ui";

type Props = { requestId: string };

export function WithdrawButton({ requestId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleWithdraw() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/leave-requests/${requestId}/withdraw`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "Nie udało się wycofać wniosku.");
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
    setConfirming(false);
  }

  return (
    <div>
      {error ? <Notice $tone="danger">{error}</Notice> : null}
      {confirming ? (
        <Button type="button" $tone="danger" disabled={pending} onClick={handleWithdraw}>
          <Glyph name="close" />
          Potwierdź wycofanie
        </Button>
      ) : (
        <Button type="button" $tone="danger" onClick={() => setConfirming(true)}>
          <Glyph name="back" />
          Wycofaj wniosek
        </Button>
      )}
    </div>
  );
}
