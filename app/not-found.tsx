import { Glyph } from "@/components/glyphs";
import { LoginCard, LoginTitle, TextLink } from "@/components/ui";

export default function NotFound() {
  return (
    <LoginCard>
      <LoginTitle>
        <Glyph name="conflict" size={28} />
        Nie ma takiej strony
      </LoginTitle>
      <TextLink href="/">Wróć do pulpitu</TextLink>
    </LoginCard>
  );
}
