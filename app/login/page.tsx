import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LoginArt,
  LoginCard,
  LoginDemo,
  LoginLogo,
  LoginPanel,
  LoginShell,
  LoginStage,
  LoginThemeSlot,
  LoginTitle,
} from "@/components/ui";

type Props = { searchParams: Promise<{ error?: string }> };

const ERRORS: Record<string, string> = {
  konfiguracja: "Serwer nie ma połączenia z Supabase. Uzupełnij .env, wykonaj migrację i uruchom npm run seed.",
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialError = params.error ? (ERRORS[params.error] ?? null) : null;
  return (
    <>
      <LoginThemeSlot>
        <ThemeToggle iconOnly />
      </LoginThemeSlot>
      <LoginStage>
        <LoginShell>
          <LoginCard>
            <LoginTitle>
              <LoginLogo src="/cm_logo.png" alt="Cer Motor" width={40} height={40} />
              Wnioski urlopowe
            </LoginTitle>
            <p>Zaloguj się, aby złożyć albo zaakceptować wniosek.</p>
            <LoginForm initialError={initialError} />
          </LoginCard>
          <LoginPanel aria-hidden="true">
            <LoginArt src="/marketing-2.png" alt="" />
          </LoginPanel>
        </LoginShell>
      </LoginStage>
      <LoginDemo>wersja demonstracyjna</LoginDemo>
    </>
  );
}
