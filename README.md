# ☕ Kafé Kos

Et stamgjestkort i lommeboka. Vis det i kassa, få vaffel.

Det er hele saken, og den viser hele plattformen:

| | Hvem | Gjør |
|---|---|---|
| 1 | **Utsteder** | Kafeen gir deg et kort med navn og bursdag |
| 2 | **Lommebok** | Kortet ligger hos deg i Kantega Lommebok, ikke hos kafeen |
| 3 | **Verifier** | Kassa spør bare om navnet, og bursdagen blir hos deg |

Appen snakker bare med **Bevisstudio**, med en **integrasjonsklient**. Bevisstudio snakker med
utstederen og verifieren for deg.

> Skal du på workshop? Oppgaven står i [WORKSHOP.md](WORKSHOP.md).

## Du trenger

- Node 22.9 eller nyere
- En konto på [ny.bevisstudio.no](https://ny.bevisstudio.no)
- **Kantega Lommebok** på mobilen: [wallet.kantega.id](https://wallet.kantega.id)

## Kom i gang

```bash
git clone https://github.com/kantega/bevisstudio-starter.git
cd bevisstudio-starter
```

**1. Lag en integrasjonsklient.** Logg inn på [ny.bevisstudio.no](https://ny.bevisstudio.no).
Registrer en organisasjon hvis du ikke har en. Bytt til **avansert visning** nederst i menyen, og
velg **Integrasjonsklienter → Ny integrasjonsklient**. Formålet er **«Test og utvikling»**.
Hemmeligheten vises bare én gang, så kopier den med en gang.

**2. Legg nøklene i `.env`.**

```bash
cp .env.example .env     # lim inn client_id og client_secret
```

**3. Start kafeen.**

```bash
npm install
npm start                # http://localhost:3333
```

Første gang lager appen bevistypen, reglene og sertifikatene den trenger. Det skjer av seg selv.
Skiltet øverst på siden står på **Åpen** når alt er klart.

## Lommeboka

Åpne **Kantega Lommebok** på [wallet.kantega.id](https://wallet.kantega.id) på mobilen, logg inn
og skann QR-koden. Har du ikke mobil, trykker du **Kopier lenka** og limer den inn i lommeboka i en
annen fane.

## Bak kulissene

Nederst på siden ser du hvert kall appen gjør mot Bevisstudio, med en setning om hva det er. Følg
med der mens du går gjennom de tre stegene, så ser du hele integrasjonen.

## Les koden

To filer:

- [`server.js`](server.js) henter token, rigger opp kafeen og har fire handlinger
- [`index.html`](index.html) er hele nettsida

Bytt kort, felter og spørsmål øverst i `server.js`, så har du din egen case.

## Prøv også

Trykk **Si opp kortet** og vis det i kassa en gang til. Kafeen har trukket det tilbake, og
lommeboka nekter å dele det. Ingen rørte mobilen din.

## Hvis noe stopper

| Du ser | Gjør |
|---|---|
| `Fikk ikke token (401)` | Sjekk `EIDAS_CLIENT_ID` og `EIDAS_CLIENT_SECRET` i `.env` |
| `Port 3333 er opptatt` | `PORT=3334 npm start` |
| `403 permission-required` | Klienten mangler en tilgang. Lag den på nytt med formålet «Test og utvikling» |
| Lommeboka sier nei til kortet | Se meldingen i lommeboka, og den røde linja i *Bak kulissene* |

---

Videre: [API-dokumentasjonen](https://bevisstudio.no/utviklere) · laget av [Kantega](https://www.kantega.no)
