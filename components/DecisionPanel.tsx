"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Glyph } from "@/components/glyphs";
import { Button, FormRow, Notice, RowActions, Select, TextArea } from "@/components/ui";
import { fullName } from "@/lib/leave/labels";
import type { Employee } from "@/lib/types";

type Props = {
  requestId: string;
  actor: "manager" | "director" | "hr";
  colleagues: Employee[];
  currentSubstituteId: string | null;
};

export function DecisionPanel({ requestId, actor, colleagues, currentSubstituteId }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [substituteId, setSubstituteId] = useState(currentSubstituteId ?? "");
  const [comment, setComment] = useState("");

  async function handleDecision(action: "accept" | "reject" | "return_employee" | "return_manager") {
    if (action !== "accept" && comment.trim().length === 0) {
      setError("Komentarz jest wymagany.");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(`/api/leave-requests/${requestId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        comment,
        substituteId: actor === "manager" ? substituteId : null,
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "Nie udało się zapisać decyzji.");
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
  }

  return (
    <div>
      {error ? <Notice $tone="danger">{error}</Notice> : null}
      {actor === "manager" ? (
        <FormRow>
          Zastępca
          <Select value={substituteId} onChange={(event) => setSubstituteId(event.target.value)}>
            <option value="">Wybierz osobę</option>
            {colleagues.map((person) => (
              <option key={person.id} value={person.id}>
                {fullName(person)}
              </option>
            ))}
          </Select>
        </FormRow>
      ) : null}
      <FormRow>
        Komentarz
        <TextArea value={comment} onChange={(event) => setComment(event.target.value)} />
      </FormRow>
      <RowActions>
        <Button type="button" $tone="ok" disabled={pending} onClick={() => handleDecision("accept")}>
          <Glyph name="check" />
          Akceptuj
        </Button>
        <Button type="button" $tone="danger" disabled={pending} onClick={() => handleDecision("reject")}>
          <Glyph name="close" />
          Odrzuć
        </Button>
        {actor === "director" || actor === "hr" ? (
          <Button type="button" disabled={pending} onClick={() => handleDecision("return_manager")}>
            <Glyph name="back" />
            Cofnij do przełożonego
          </Button>
        ) : null}
        {actor !== "director" ? (
          <Button type="button" disabled={pending} onClick={() => handleDecision("return_employee")}>
            <Glyph name="back" />
            Cofnij do pracownika
          </Button>
        ) : null}
      </RowActions>
    </div>
  );
}
