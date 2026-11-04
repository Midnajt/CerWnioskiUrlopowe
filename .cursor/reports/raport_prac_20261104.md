# Raport prac — Cer, wnioski urlopowe

Data: 2026-11-04.

## Zakres

Dopracowanie wyglądu i ruchu na pulpicie oraz na stronie logowania. Logika wniosków, baza i ścieżka akceptacji bez zmian. Ciemny motyw zostaje przy dwunastu próbkach z `lib/styles/theme.ts`.

## Wygląd jasnego pulpitu

Paleta jasnego pulpitu w `theme.surface`:

- strona `#F8FAFC`, karty i kafelki `#FFFFFF`, tekst `#0F172A`, kreski `#E2E8F0`, akcent `#2563EB`
- sukces `#16A34A` i ostrzeżenie `#EA580C` na komunikatach i przyciskach
- awatar i plakietka „NOWE” nadal `#D92D59`
- stonowany tekst `#64748B`

Belka powitania i jej barwy bez zmian. Mgła Vanta w `components/WelcomeFog.tsx` ma `speed` 2.

## Ruch

Karta pod kafelkami wchodzi raz, około 0,18 s (`components/PageTransition.tsx`). Belka i kafelki stoją. Wcześniejsze zaniknięcie i drugie wejście tej samej karty zostało zdjęte.

Aktywny kafelek ma niebieskie tło. Tło, kolor napisu, ikona i obwódka, także po najechaniu, zmieniają się w 0,18 s. Przy ograniczeniu ruchu w systemie przejście kafelka jest wyłączone.

## Pulpit i formularz

- Napis „Wnioski urlopowe” w belce prowadzi na `/`.
- Otwarty kafelek jest oznaczony. Widok wniosku (`/wnioski/[id]`) zapala „Moje wnioski urlopowe”, a nie „Utwórz wniosek urlopowy”. Na pulpicie żaden kafelek nie jest zapalony.
- Z formularza zniknął napis „Nazwa procesu: Wniosek urlopowy” i przełącznik „Cały dzień”. Nowy wniosek zapisuje się jako cały dzień, a godziny liczą się z dni roboczych. Numer wniosku na stronie szczegółów zostaje w nagłówku.

## Logowanie

Na `/login`:

- w tytule zostaje „Wnioski urlopowe” i logo, bez napisu CerMotor
- karta ma niebieską obwódkę
- przy dolnej krawędzi ekranu jest czarny pasek z napisem „wersja demonstracyjna”

## Sprawdzenie

W przeglądarce, na koncie Anny Kowalskiej: przejścia między kafelkami, paleta, róż na awatarze, zielony i pomarańczowy na komunikacie i przyciskach, ciemny motyw przy starych próbkach, brak nazwy procesu i przełącznika „Cały dzień”, niebieski kafelek, powrót na pulpit z belki.

Strona logowania: sam tytuł „Wnioski urlopowe”, obwódka `#2563EB`, pasek „wersja demonstracyjna” na tle `#070803`.

## Następny krok

Osobna decyzja o ciemnym motywie.
