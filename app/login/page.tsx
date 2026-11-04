import { LoginForm } from "@/components/LoginForm";
import { LoginCard, LoginDemo, LoginLogo, LoginTitle } from "@/components/ui";

type Props = { searchParams: Promise<{ error?: string }> };

const ERRORS: Record<string, string> = {
  konfiguracja: "Serwer nie ma połączenia z Supabase. Uzupełnij .env, wykonaj migrację i uruchom npm run seed.",
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialError = params.error ? (ERRORS[params.error] ?? null) : null;
  return (
    <>
      <LoginCard>
        <LoginTitle>
          <LoginLogo src="/cm_logo.png" alt="Logo CerMotor" width={64} height={64} />
          <span>Wnioski urlopowe</span>
        </LoginTitle>
        <p>Zaloguj się, aby złożyć albo zaakceptować wniosek.</p>
        <LoginForm initialError={initialError} />
      </LoginCard>
      <LoginDemo>wersja demonstracyjna</LoginDemo>
    </>
  );
}
