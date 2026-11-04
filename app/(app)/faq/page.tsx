import { CardHeading } from "@/components/glyphs";
import { Card } from "@/components/ui";

export default function FaqPage() {
  return (
    <>
      <Card>
        <CardHeading name="faq">Role</CardHeading>
        <p>
          Każda osoba jest pracownikiem i składa własne wnioski, także wtedy, gdy dodatkowo akceptuje wnioski innych.
          Jedno konto może łączyć kilka funkcji. Rola nie jest wybierana przy logowaniu: przełożony wynika ze struktury,
          a dyrektor i kadry są oznaczeni na koncie.
        </p>
        <p>
          <strong>Pracownik</strong> tworzy wniosek, wskazuje termin i zastępcę, śledzi status w „Moje wnioski urlopowe”
          i widzi swoje limity na pulpicie. Przed ostatecznym zatwierdzeniem może wniosek wycofać. Wniosek cofnięty do
          pracownika da się poprawić i złożyć ponownie.
        </p>
        <p>
          <strong>Przełożony</strong> dostaje wnioski osób, które ma w zespole. Ocenia termin i wpływ na pracę zespołu.
          W „Moje zadania” może wniosek zaakceptować, odrzucić albo cofnąć do pracownika. Odrzucenie i cofnięcie wymagają
          komentarza. Informacja o innych nieobecnościach w zespole jest ostrzeżeniem: sama nie zatrzymuje wniosku.
        </p>
        <p>
          <strong>Dyrektor</strong> wchodzi tylko wtedy, gdy urlop trwa dłużej niż 21 dni kalendarzowych, licząc od dnia
          rozpoczęcia do dnia zakończenia włącznie. Dostaje wniosek po przełożonym, a przed kadrami. Może go zaakceptować,
          odrzucić albo cofnąć do przełożonego. Tego kroku nie da się pominąć ręcznie. Jeśli nie ma dyrektora innego niż
          osoba składająca wniosek, system przekazuje wniosek od razu do kadr.
        </p>
        <p>
          <strong>Kadry</strong> robią kontrolę formalną i limitu, a potem zatwierdzają wniosek. Nie rozstrzygają ponownie,
          czy zespół da radę bez tej osoby, skoro przełożony już to zaakceptował. Mogą wniosek odrzucić, cofnąć do
          pracownika albo cofnąć do przełożonego. Widzą też kafelek „Urlopy pracowników”.
        </p>
      </Card>
      <Card>
        <CardHeading name="list">Jak przebiega wniosek</CardHeading>
        <ol>
          <li>
            Wejdź w „Utwórz wniosek urlopowy”. Wybierz rodzaj: urlop bieżący, zaległy, na żądanie albo odbiór dnia wolnego
            za pracę w sobotę. Przy zaległym system zużywa najstarszy rok. Urlop na żądanie ma rocznie do 4 dni i schodzi
            z puli bieżącej.
          </li>
          <li>
            Podaj termin i zastępcę. Dni urlopu liczą się bez sobót, niedziel i świąt z kalendarza firmy. Brak limitu albo
            zastępca nieobecny w tym terminie blokuje złożenie. Możesz zapisać wersję roboczą albo od razu przekazać
            wniosek do akceptacji.
          </li>
          <li>
            Po złożeniu wniosek czeka na przełożonego. Zadanie widać u niego w „Moje zadania”, a liczba nowych zadań jest
            na belce powitania. Gdy przełożony sam ma zastępstwo, nowe wnioski idą do jego zastępcy. Osoba bez przełożonego
            pomija ten krok.
          </li>
          <li>
            Po akceptacji przełożonego wniosek idzie do kadr. Wyjątkiem jest urlop dłuższy niż 21 dni kalendarzowych:
            wtedy najpierw decyduje dyrektor, a dopiero potem kadry.
          </li>
          <li>
            Zatwierdzenie przez kadry kończy ścieżkę. Wniosek dostaje status „Zaakceptowany” i pojawia się w kalendarzu.
            Do tego momentu autor może go wycofać w „Moje wnioski urlopowe”.
          </li>
        </ol>
        <p>
          Własne wnioski i ich status są w „Moje wnioski urlopowe”. Decyzje do podjęcia są w „Moje zadania”. Kalendarz
          zespołu jest w „Urlopy zespołu”, a kadry mają dodatkowo „Urlopy pracowników”.
        </p>
      </Card>
    </>
  );
}
