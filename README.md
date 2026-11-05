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
- **Kantega Lommebok** fra App Store på mobilen

## Kom i gang

```bash
git clone https://github.com/kantega/bevisstudio-starter.git
cd bevisstudio-starter
```

**1. Hent nøklene i Bevisstudio.**

1. Logg inn på [ny.bevisstudio.no](https://ny.bevisstudio.no). Registrer en organisasjon hvis du
   ikke har en.
2. Velg **Avansert visning** nederst i menyen. Uten den får ikke klienten sjekke bevis.
3. Gå til **Integrasjonsklienter**, og trykk **Lag integrasjonsklient**.
4. Velg formålet **Test og utvikling**, og trykk **Neste** gjennom tilgangene.
5. Gi klienten et navn, for eksempel «Kafé Kos», og trykk **Lag klienten**.
6. Nå ser du `client_id` og `client_secret`. Trykk knappen **Som miljøvariabler**. Den kopierer
   begge, ferdig til å limes inn i `.env`.

Hemmeligheten vises bare denne ene gangen. Lukker du skuffen før du har kopiert den, lager du en
ny med **Lag ny hemmelighet** på klienten.

**2. Lim nøklene inn i `.env`.**

```bash
cp .env.example .env
```

Åpne `.env`, og bytt ut linjene `CLIENT_ID=…` og `CLIENT_SECRET=…` med det du kopierte.

**3. Start kafeen.**

```bash
npm install
npm start                # http://localhost:3333
```

Første gang lager appen bevistypen, reglene og sertifikatene den trenger. Det skjer av seg selv.
Skiltet øverst på siden står på **Åpen** når alt er klart.

## Lommeboka

Vi anbefaler **Kantega Lommebok** fra App Store. Last den ned, logg inn og skann QR-koden.
Bruk helst ikke nettlommeboka.

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
| `Fikk ikke token (401)` | Sjekk `CLIENT_ID` og `CLIENT_SECRET` i `.env`. Mistet hemmeligheten? **Lag ny hemmelighet** på klienten i Studio |
| `Port 3333 er opptatt` | `PORT=3334 npm start` |
| `403 permission-required` | Klienten mangler en tilgang. Lag den på nytt med formålet «Test og utvikling» |
| Lommeboka sier nei til kortet | Se meldingen i lommeboka, og den røde linja i *Bak kulissene* |

---

Videre: [API-dokumentasjonen](https://bevisstudio.no/utviklere) · laget av [Kantega](https://www.kantega.no)
