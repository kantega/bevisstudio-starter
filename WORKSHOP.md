# Workshop: lag ditt eget bevis

Du skal utstede et digitalt bevis, ta det med deg i **Kantega Lommebok** og vise det fram til noen
som sjekker det. Først med Kafé Kos, så med din egen case.

**Tid:** ca. 90 minutter. **Du trenger:** en laptop med Node 22.9+ og en mobil med Kantega Lommebok fra App Store.

---

## Del 1 · Kom i gang (15 min)

1. **Lag en konto** på [ny.bevisstudio.no](https://ny.bevisstudio.no). Registrer en organisasjon
   hvis du ikke har en. Den gir deg en utsteder og en verifier med det samme.
2. **Lag en integrasjonsklient.** Bytt til **avansert visning** nederst i menyen, og velg
   **Integrasjonsklienter → Ny integrasjonsklient**. Formålet er **«Test og utvikling»**.
   Kopier `client_id` og `client_secret` med en gang. Hemmeligheten vises bare én gang.
3. **Klon starteren.**
   ```bash
   git clone https://github.com/kantega/bevisstudio-starter.git
   cd bevisstudio-starter
   ```
4. **Lag `.env`** og lim inn nøklene.
   ```bash
   cp .env.example .env
   ```
5. **Start.**
   ```bash
   npm install
   npm start
   ```
   Åpne <http://localhost:3333>. Skiltet øverst skal stå på **Åpen**.
6. **Last ned Kantega Lommebok** fra App Store, og logg inn. Vi anbefaler appen; bruk helst ikke
   nettlommeboka.

✅ **Ferdig når:** skiltet står på Åpen, og du er logget inn i lommeboka.

---

## Del 2 · Kjør Kafé Kos (15 min)

1. **Få kortet.** Skriv navn og bursdag, trykk **Lag kortet**, og skann QR-koden med Kantega Lommebok.
2. **I kassa.** Trykk **Vis kortet i kassa**, skann og del.
3. **Si opp kortet**, og vis det i kassa en gang til.

Legg merke til:

- **Kassa fikk navnet ditt, men ikke bursdagen.** Kortet har begge, men kassa spurte bare om navnet.
  Det kalles selektiv fremvisning, og det er hele poenget.
- **Kafeen har ingen kopi å slå opp i.** Kortet ligger hos deg.
- **Åpne *Bak kulissene*** nederst på siden. Der står hvert kall appen gjorde. Det er hele
  integrasjonen.

✅ **Ferdig når:** du har fått «Velkommen!» i kassa, og lommeboka har nektet å dele det oppsagte kortet.

---

## Del 3 · Din egen case (40 min)

Finn på et bevis. En god case er **hyper enkel**:

- **Én** som gir beviset, **ett** bevis og **én** som sjekker det.
- Den som sjekker, ber om **mindre** enn beviset har.
- Det gir mening å **trekke det tilbake**.

Trenger du en idé?

| Bevis | Hvem sjekker | Ber om | Holdes tilbake |
|---|---|---|---|
| 📚 Lånekort | Bibliotekaren | navn | adresse |
| 🎟️ Julebordsbillett | Døra | navn, bord | allergier |
| 🏡 Hyttenøkkel | Hytta | hytte, uke | telefon |
| 🎓 Kursbevis | Arbeidsgiveren | kurs, bestått | karakter |
| 🍷 Over 18 | Baren | over_18 (ja) | fødselsdato |
| 🐕 Hundepass | Hundeparken | vaksinert | eierens adresse |

**Slik bytter du case.** Øverst i `server.js` står tre ting:

```js
const KORT = { name: "Stamgjestkort", claims: [ /* feltene på beviset */ ] };
const KASSA = "Kassa på Kafé Kos";   // navnet på den som sjekker
const SPOR = ["navn"];               // det den som sjekker ber om
```

- **Gi `KORT` og `KASSA` nye navn** hver gang du endrer feltene. Oppsettet gjenbruker det som
  allerede finnes med samme navn, og da får du de gamle feltene.
- `dataType` er `STRING`, `NUMBER`, `BOOLEAN`, `DATE` (`ÅÅÅÅ-MM-DD`) eller `IMAGE`.
- Skjemaet i `index.html` må ha et `<input name="…">` per felt, med samme navn som i `KORT`.
- Start på nytt med `npm start` etter en endring.

✅ **Ferdig når:** du har utstedt **ditt** bevis til Kantega Lommebok, og den som sjekker får bare
det den spurte om.

---

## Del 4 · Lag en nydelig frontend (valgfritt)

`index.html` er din. Gjør den til din case: farger, ord, kortet, stemningen. Bruk gjerne et
rammeverk du liker.

To regler:

- **Hemmeligheten blir på serveren.** Nettsida kaller bare `/api/…` i `server.js`, aldri Bevisstudio
  direkte.
- **Lommeboka er gjestens.** Du viser en QR-kode. Du styrer aldri hva lommeboka viser eller spør om.

---

## Del 5 · Vis fram (10 min)

Ett minutt hver:

1. Hva er beviset, og hvem sjekker det?
2. Hva får den som sjekker **ikke** vite?
3. Hva skjer når beviset trekkes tilbake?

---

## Står du fast?

Se tabellen *Hvis noe stopper* i [README.md](README.md). Spør oss med tre ting: hva skiltet sier,
den røde linja i *Bak kulissene* og `✗`-linja i terminalen.

**Aldri** del innholdet i `.env`, og ikke commit den. Den er allerede i `.gitignore`.
