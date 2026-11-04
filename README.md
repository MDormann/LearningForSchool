# Lernkiste

Eine kleine Lern-App mit Übungen für Vorschulkinder und für die 2. Klasse – als Web-App (PWA), die sich auf dem Handy oder Tablet wie eine
normale App installieren lässt und danach auch offline funktioniert.

**Live:** https://mdormann.github.io/LearningForSchool/

## Übungen

Auf der Startseite wählt man oben den Bereich **Vorschule** oder **2. Klasse**; der zuletzt gewählte Bereich bleibt gespeichert.

### Vorschule

| Bereich | Übung | Worum geht's |
| --- | --- | --- |
| Zahlen | Zählen bis 20 | Zahlen der Reihe nach antippen (geordnet oder gemischt) |
| Zahlen | Mengen zählen | Gegenstände zählen (bis 5, 10 oder 20; in Reihen oder durcheinander), zum Mitzählen antippen |
| Zahlen | Countdown | Rückwärts von 10 bis 1 – dann startet die Rakete |
| Zahlen | Würfelblick | Punktbilder kurz sehen und die Anzahl ohne Zählen erkennen |
| Zahlen | Zehnerfeld-Blitz | Ausgemalte Kästchen im Zehnerfeld auf Zeit erkennen, mit Bestzeit |
| Zahlen | Nachbarzahlen | Welche Zahl kommt davor / danach (bis 10 oder 20, mit Zahlenstrahl) |
| Zahlen | Ballblitz | Wovon sind es mehr? Mengen schätzen statt zählen |
| Buchstaben & Wörter | Anlaute | Bild → Anfangsbuchstabe oder Buchstabe → Bild |
| Buchstaben & Wörter | Silben klatschen | Wie viele Silben hat das Wort? |
| Buchstaben & Wörter | Wo ist was? | Lagewörter: auf, unter, neben, hinter, vor, in (Bild oder Wort finden) |
| Knobeln | Muster legen | Formen-/Farbmuster fortsetzen |
| Knobeln | Memory | Paare finden (Tiere, Essen, Sachen) |

### 2. Klasse

| Bereich | Übung | Worum geht's |
| --- | --- | --- |
| Plus & Minus | Rechenolympiade | Plus/Minus bis 20 (mit Zehnerübergang oder alle), 10/20/48 Aufgaben auf Zeit, Bestzeit |
| Plus & Minus | Ergänzen | Platzhalteraufgaben wie 8 + ? = 13 oder ? − 5 = 7, bis 20 oder bis 100 |
| Plus & Minus | Rechnen bis 100 | Stufen: Zehner, + Einer, Zehnerübergang, zweistellig + zweistellig |
| Mal & Geteilt | Einmaleins | Mal-/Geteiltaufgaben, Reihen 1–10 frei wählbar |

Antworten werden über ein Zahlenfeld (oder die Tastatur) eingegeben. Nach einem Fehler zeigt die App einen Rechenweg
(z. B. „Zerlege die 7: 4 + 3 – erst bis 10, dann den Rest“), nach dem zweiten Fehler die Lösung. Am Ende lassen sich die
falsch gelösten Aufgaben gezielt nochmal üben.

Aufgaben werden per Sprachausgabe des Geräts vorgelesen; Sterne und Einstellungen werden lokal im Browser gespeichert.

## Entwicklung

```bash
npm install
npm run dev       # Entwicklungsserver
npm run build     # Typecheck + Produktions-Build nach dist/
npm run preview   # Build lokal ansehen
```

Technik: React + TypeScript + Vite, PWA über `vite-plugin-pwa`, Schriften (Andika, Baloo 2) lokal eingebunden.

### Neue Übung hinzufügen

1. Komponente in `src/exercises/` anlegen (Rechenübungen: in `src/exercises/klasse2/` mit der `Drill`-Komponente und einem Aufgaben-Generator aus `tasks.ts`), die `<Shell>` (Rahmen mit Zurück-Knopf) und am Ende `<Finish>` rendert.
2. Eintrag in `src/exercises/index.tsx` ergänzen – Startseite und Routing übernehmen sie automatisch.

### Icons

`public/icon.svg` ist die Vorlage; die PNG-Icons erzeugt `node scripts/make-icons.mjs` (braucht Playwright).

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages
(`.github/workflows/deploy.yml`). Einmalig nötig: im Repository unter **Settings → Pages → Build and deployment**
als Quelle **GitHub Actions** auswählen.
