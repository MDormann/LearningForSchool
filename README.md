# Lernkiste

Eine kleine Lern-App mit Vorschulübungen für Kinder – als Web-App (PWA), die sich auf dem Handy oder Tablet wie eine
normale App installieren lässt und danach auch offline funktioniert.

**Live:** https://mdormann.github.io/LearningForSchool/

## Übungen

| Bereich | Übung | Worum geht's |
| --- | --- | --- |
| Zahlen | Zählen bis 20 | Zahlen der Reihe nach antippen (geordnet oder gemischt) |
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

1. Komponente in `src/exercises/` anlegen, die `<Shell>` (Rahmen mit Zurück-Knopf) und am Ende `<Finish>` rendert.
2. Eintrag in `src/exercises/index.tsx` ergänzen – Startseite und Routing übernehmen sie automatisch.

### Icons

`public/icon.svg` ist die Vorlage; die PNG-Icons erzeugt `node scripts/make-icons.mjs` (braucht Playwright).

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages
(`.github/workflows/deploy.yml`). Einmalig nötig: im Repository unter **Settings → Pages → Build and deployment**
als Quelle **GitHub Actions** auswählen.
