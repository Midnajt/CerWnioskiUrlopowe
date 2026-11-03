import { Glyph } from "@/components/glyphs";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginCard, LoginTitle, RowActions } from "@/components/ui";

type Props = { searchParams: Promise<{ error?: string }> };

const ERRORS: Record<string, string> = {
  konfiguracja: "Serwer nie ma połączenia z Supabase. Uzupełnij .env, wykonaj migrację i uruchom npm run seed.",
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialError = params.error ? (ERRORS[params.error] ?? null) : null;
  return (
    <LoginCard>
      <RowActions>
        <ThemeToggle />
      </RowActions>
      <LoginTitle>
        <Glyph name="login" size={28} />
        Cer — wnioski urlopowe
      </LoginTitle>
      <p>Zaloguj się, aby złożyć albo zaakceptować wniosek.</p>
      <LoginForm initialError={initialError} />
    </LoginCard>
  );
}
