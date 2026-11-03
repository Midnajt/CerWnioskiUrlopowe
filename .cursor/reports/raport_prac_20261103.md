# Raport prac — Cer, wnioski urlopowe

Data: 2026-11-03.

## Zakres

Pierwsza wersja aplikacji Cer Motor do urlopu wypoczynkowego. Źródło procesu: `docs/specyfikacja_procesu_urlopy_20261103.md`. Reguły produktu są w `.cursor/rules/`.

Aplikacja to jeden projekt Next.js (App Router, TypeScript strict) pod deploy na Vercel. Styl: styled-components i dwanaście próbek z `lib/styles/theme.ts`. Baza i logowanie: Supabase (Postgres + Auth), region EU. Przeglądarka nie dostaje klienta Supabase ani klucza z przedrostkiem `NEXT_PUBLIC_`.

## Co jest w repozytorium

- Reguły stacku, frontu, backendu i bazy oraz odnośnik w `docs/shared.mdc`.
- Szkielet Next.js, healthcheck `GET /api/health`, `.env.example`.
- Schemat w `docs/db.md` i migracja `supabase/migrations/20261103130000_init.sql`.
- Dostęp do danych tylko w `lib/db/`. Reguły wniosku w `lib/leave/`.
- Seed: `npm run seed` (`scripts/seed.ts`) — konta Auth, działy, limity, święta roku bieżącego i dwóch kolejnych, przykładowa nieobecność i zastępstwo.
- Logowanie i wylogowanie, sesja httpOnly, ochrona stron w `proxy.ts`.
- Wniosek bieżący i zaległy: limit, zastępca, zapis roboczy, złożenie, wycofanie.
- Akceptacja przełożonego, dyrektora i kadr, historia zdarzeń, zadania i komunikaty w aplikacji.
- Pulpit, lista wniosków, zadania, kalendarz, lista pracowników dla kadr.
- Ikony `react-icons` oraz przełącznik jasny/ciemny obok wylogowania. Wybór motywu zostaje w przeglądarce. Ciemny motyw używa tych samych dwunastu próbek.

## Ekrany i API

Strony: `/login`, `/`, `/wnioski`, `/wnioski/nowy`, `/wnioski/[id]`, `/zadania`, `/kalendarz`, `/pracownicy`.

API: logowanie, wylogowanie, health, utworzenie i edycja wniosku, decyzja, wycofanie.

## Ustalenia wdrożone w kodzie

- Przełożony wynika z `manager_id`. Dyrektor i kadry to flagi, więc jedna osoba może mieć kilka funkcji i składa własny wniosek.
- Dyrektor wchodzi do ścieżki, gdy okres kalendarzowy od daty rozpoczęcia do zakończenia włącznie ma więcej niż 21 dni.
- Brak limitu blokuje złożenie. Zapis roboczy ponad limit jest możliwy.
- Zaległy schodzi od najstarszego roku. System nie zmusza, żeby wybrać zaległy przed bieżącym.
- Limit z seeda jest źródłem prawdy. Wymiar etatu jest zapisany i nie przelicza puli.
- Dni robocze: soboty, niedziele i święta z tabeli.
- Zastępca nie może być nieobecny w wybranym terminie. Osobnej akceptacji zastępcy nie ma.
- Zastępstwo osoby akceptującej kieruje nowe wnioski do zastępcy, jeden przeskok.
- Odrzucenie i cofnięcie wymagają komentarza. Zatwierdzonego wniosku nie da się zmienić ani wycofać.

Poza tą wersją zostały: SENIOR, administrator, pozostałe rodzaje nieobecności, załączniki, mail, przypomnienia, integracja HR i Outlook, urlop godzinowy, harmonogramy zmianowe.

## Supabase

Migracja została uruchomiona w projekcie w panelu. Seed doszedł za drugim podejściem: w `.env` pod `SUPABASE_URL` był adres strony ustawień, a nie adres API (`https://<ref>.supabase.co`). Po poprawce `npm run seed` założył sześć kont. Hasło wszystkich to `SEED_PASSWORD` z `.env`.

| Adres | Funkcja |
|---|---|
| anna.kowalska@cer.example | pracownik |
| piotr.zielinski@cer.example | pracownik z niskim limitem |
| barbara.lewandowska@cer.example | pracownik z zaakceptowanym urlopem od dziś |
| robert.wisniewski@cer.example | przełożony |
| ewa.nowak@cer.example | dyrektor |
| marek.kadry@cer.example | kadry |

## Sprawdzenie

- `npx tsc --noEmit` przechodzi.
- `npm test`: 13 testów dni roboczych, progu 21 dni, limitów i ścieżki decyzji.
- Wcześniejszy `next build` kończył się poprawnie, zanim doszły ikony i ciemny motyw.
- W przeglądarce: ekran logowania, komunikat braku konfiguracji zanim był adres API, pulpit Anny Kowalskiej, turkusowa obwódka kart, ikony, przełącznik motywu i formularz nowego wniosku w ciemnym motywie. Na wąskim oknie belka i kafelki się mieszczą.

Nieprzechodzone jeszcze na żywych kontach od początku do końca: złożenie wniosku krótszego i dłuższego niż 21 dni, akceptacja przełożonego, dyrektora i kadr, odrzucenie z komentarzem oraz blokada limitu Piotra.

## Następny krok

Przejść w przeglądarce ścieżkę czterech funkcji na kontach z seeda: krótki wniosek, wniosek powyżej 21 dni i blokadę braku limitu.
