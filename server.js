// Kafé Kos — en liten server mellom nettsida og Bevisstudio.
//
// Hvorfor en server i det hele tatt: hemmeligheten til integrasjonsklienten skal aldri
// ligge i nettleseren. Serveren henter et token med den, og nettsida får bare fire
// ferdige handlinger: lag kort, se om kortet er hentet, vis kortet i kassa, se svaret.
//
// Alt går til Bevisstudio. Utstederen og verifieren kaller vi aldri selv — Bevisstudio
// gjør det for oss — og lommeboka tilhører gjesten.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";

const STUDIO = (process.env.EIDAS_STUDIO_URL ?? "").replace(/\/$/, "");
// Navnene Bevisstudio gir deg med «Kopier som miljøvariabler». EIDAS_-navnene virker også.
const CLIENT_ID = process.env.CLIENT_ID ?? process.env.EIDAS_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.CLIENT_SECRET ?? process.env.EIDAS_CLIENT_SECRET ?? "";
const PORT = Number(process.env.PORT ?? 3333);
// Lommeboka gjestene bruker. Bare til lenkene på siden — appen kaller den aldri.
const LOMMEBOK = (process.env.EIDAS_WALLET_URL ?? "https://wallet.kantega.id").replace(/\/$/, "");

if (!STUDIO || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n  Mangler nøklene. Kopier .env.example til .env og lim inn CLIENT_ID og CLIENT_SECRET fra Bevisstudio.\n");
  process.exit(1);
}

// ── Casen ─────────────────────────────────────────────────────────────────────────────
// Bytt disse tre, så har du din egen case. Gi kortet og kassa NYE navn når du endrer feltene:
// oppsettet finner det som finnes på navnet, og gjenbruker et gammelt kort med gamle felt.
//
// dataType: STRING | NUMBER | BOOLEAN | DATE ("ÅÅÅÅ-MM-DD") | IMAGE

const KORT = {
  name: "Stamgjestkort",
  validFor: "P1Y",
  claims: [
    { name: "navn", dataType: "STRING", mandatory: true, displayName: "Navn" },
    { name: "bursdag", dataType: "DATE", mandatory: true, displayName: "Bursdag" },
  ],
};
const KASSA = "Kassa på Kafé Kos";
const SPOR = ["navn"]; // det kassa ber om — be om mindre enn kortet har

// ── Token ─────────────────────────────────────────────────────────────────────────────

let token = null;

async function hentToken() {
  if (token && token.utloper > Date.now()) return token.verdi;
  // Les adressen fra metadataene i stedet for å gjette den.
  const meta = await fetch(`${STUDIO}/.well-known/oauth-authorization-server`).then((r) => r.json());
  const svar = await fetch(meta.token_endpoint, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  loggfor({ metode: "POST", sti: new URL(meta.token_endpoint).pathname, status: svar.status, ms: 0 });
  if (!svar.ok) throw new Error(`Fikk ikke token (${svar.status}). Stemmer nøklene i .env?`);
  const { access_token, expires_in } = await svar.json();
  token = { verdi: access_token, utloper: Date.now() + (expires_in - 30) * 1000 };
  return access_token;
}

// ── Bak kulissene ─────────────────────────────────────────────────────────────────────
// Hvert kall mot Bevisstudio havner her, så nettsida kan vise hva som faktisk skjer.

const logg = [];
let nesteNr = 1;

function loggfor(rad) {
  logg.push({ nr: nesteNr++, tid: Date.now(), ...rad });
  if (logg.length > 200) logg.shift();
}

async function studio(metode, sti, kropp) {
  const start = Date.now();
  const svar = await fetch(STUDIO + sti, {
    method: metode,
    headers: {
      Authorization: `Bearer ${await hentToken()}`,
      ...(kropp ? { "Content-Type": "application/json" } : {}),
    },
    body: kropp ? JSON.stringify(kropp) : undefined,
  });
  const tekst = await svar.text();
  // Bare metode, sti og status — aldri tokenet, og aldri lenkene i svarene.
  loggfor({ metode, sti, status: svar.status, ms: Date.now() - start });
  if (!svar.ok) {
    const feil = new Error(`${metode} ${sti} svarte ${svar.status}: ${tekst}`);
    feil.status = svar.status;
    throw feil;
  }
  return tekst ? JSON.parse(tekst) : {};
}

// ── Oppsettet, én gang ────────────────────────────────────────────────────────────────
// Trygt å kjøre om igjen: finner det som finnes, lager bare det som mangler.

let oppsett = null;
let oppsettStatus = { klar: false, feil: null };

function sorgForOppsett() {
  oppsett ??= rigg().then(
    (resultat) => {
      oppsettStatus = { klar: true, feil: null };
      return resultat;
    },
    (feil) => {
      oppsett = null; // prøv igjen neste gang
      oppsettStatus = { klar: false, feil: feil.message };
      throw feil;
    },
  );
  return oppsett;
}

async function rigg() {
  const [utsteder] = await studio("GET", "/v1/issuers");
  const [verifier] = await studio("GET", "/v1/verifiers");
  if (!utsteder || !verifier) {
    throw new Error("Organisasjonen din mangler utsteder eller verifier. Er den registrert i ny.bevisstudio.no?");
  }

  // Lån Kantegas sandkassesertifikater. Uten dem stopper det først i lommeboka.
  await studio("POST", `/v1/issuers/${utsteder.id}/certificates/platform-default`);
  await studio("POST", `/v1/verifiers/${verifier.id}/access-certificates/platform-default`);

  const typer = await studio("GET", "/v1/credential-types");
  const type = typer.find((t) => t.name === KORT.name) ?? (await studio("POST", "/v1/credential-types", KORT));

  const regler = await studio("GET", "/v1/issuance-rules");
  const regel =
    regler.find((r) => r.credentialTypeId === type.id) ??
    (await studio("POST", "/v1/issuance-rules", {
      issuerId: utsteder.id,
      credentialTypeId: type.id,
      name: "Stamgjestkort ved disken",
      method: "PRE_AUTHORIZED_CODE",
    }));

  // Publiser til utstederen. Svaret gir vct-en kassa skal be om.
  const { deployed } = await studio("PUT", `/v1/issuance-rules/${regel.id}/deployment`, {});

  const kassaregler = await studio("GET", "/v1/verification-rules");
  const kassa =
    kassaregler.find((r) => r.name === KASSA) ??
    (await studio("POST", "/v1/verification-rules", {
      verifierId: verifier.id,
      name: KASSA,
      query: {
        credentials: [
          {
            id: "stamgjestkort",
            format: "dc+sd-jwt",
            meta: { vct_values: [deployed.vct] },
            claims: SPOR.map((felt) => ({ path: [felt] })),
          },
        ],
      },
    }));

  console.log("  ☕ Kafeen er klar.");
  return { regelId: regel.id, kassaId: kassa.id };
}

// ── De fire handlingene ───────────────────────────────────────────────────────────────

const qr = (tekst) => QRCode.toString(tekst, { type: "svg", margin: 1, color: { dark: "#3b2418", light: "#0000" } });

async function lagKort(skjema) {
  // Bare feltene kortet har. Tall og ja/nei kommer som tekst fra skjemaet, og må gjøres om.
  const claims = Object.fromEntries(
    KORT.claims
      .filter((c) => skjema[c.name] !== undefined && skjema[c.name] !== "")
      .map((c) => {
        const verdi = skjema[c.name];
        if (c.dataType === "NUMBER") return [c.name, Number(verdi)];
        if (c.dataType === "BOOLEAN") return [c.name, verdi === true || verdi === "true" || verdi === "on"];
        return [c.name, verdi];
      }),
  );
  const { regelId } = await sorgForOppsett();
  // Ingen Idempotency-Key: er den ikke slått på i miljøet, svarer hvert nøklet kall 503.
  const ordre = await studio("POST", `/v1/issuance-rules/${regelId}/issuance-orders`, {
    format: "dc+sd-jwt",
    claims,
  });
  return { ordreId: ordre.orderId, lenke: ordre.offerUri, qr: await qr(ordre.offerUri) };
}

async function kortStatus(ordreId) {
  const ordre = await studio("GET", `/v1/issuance-orders/${encodeURIComponent(ordreId)}`);
  const bevis = (ordre.items ?? []).flatMap((i) => i.credentials ?? [])[0];
  return { status: ordre.status, bevisId: bevis?.credentialId ?? null };
}

async function visIKassa() {
  const { kassaId } = await sorgForOppsett();
  const okt = await studio("POST", "/v1/verification-sessions", { verificationRuleId: kassaId });
  const lenke =
    `openid4vp://?client_id=${encodeURIComponent(okt.clientId)}` +
    `&request_uri=${encodeURIComponent(okt.requestUri)}`;
  return { oktId: okt.id, lenke, qr: await qr(lenke) };
}

async function kassaSvar(oktId) {
  const id = encodeURIComponent(oktId);
  const { phase } = await studio("GET", `/v1/verification-sessions/${id}`);
  if (phase === "EXPIRED") return { ferdig: true, godkjent: false, grunn: "tiden gikk ut" };
  if (!["VERIFIED", "REJECTED"].includes(phase)) return { ferdig: false };
  const resultat = await studio("GET", `/v1/verification-sessions/${id}/result`);
  const bevis = resultat.presentations?.[0];
  return {
    ferdig: true,
    godkjent: resultat.status === "VERIFIED",
    // Verdiene kassa fikk, som tekst. Et claim kan være vilkårlig JSON.
    verdier: Object.fromEntries(
      SPOR.filter((felt) => felt in (bevis?.claims ?? {})).map((felt) => {
        const verdi = bevis.claims[felt];
        return [felt, typeof verdi === "string" ? verdi : JSON.stringify(verdi)];
      }),
    ),
    // Bare kortets egne felt. iss, vct, status osv. har alle bevis, og de er ikke poenget her.
    delt: Object.keys(bevis?.claims ?? {}).filter((felt) => KORT.claims.some((c) => c.name === felt)),
    sjekker: (bevis?.checks ?? []).map(({ name, outcome }) => ({ navn: name, utfall: outcome })),
    grunn: resultat.failures?.[0]?.check ?? resultat.status,
  };
}

async function siOppKort(bevisId) {
  await studio("POST", `/v1/credentials/${encodeURIComponent(bevisId)}/revoke`, { reason: "Kortet er sagt opp" });
  return { oppsagt: true };
}

// ── Nettsida ──────────────────────────────────────────────────────────────────────────

async function lesKropp(req) {
  let tekst = "";
  for await (const bit of req) tekst += bit;
  return tekst ? JSON.parse(tekst) : {};
}

const ruter = [
  ["GET", /^\/api\/status$/, () => ({
    ...oppsettStatus,
    lommebok: LOMMEBOK,
    felt: KORT.claims.map((c) => ({ navn: c.name, visning: c.displayName ?? c.name })),
  })],
  ["GET", /^\/api\/logg$/, (req) => {
    const etter = Number(new URL(req.url, "http://x").searchParams.get("etter") ?? 0);
    return logg.filter((rad) => rad.nr > etter);
  }],
  ["POST", /^\/api\/kort$/, async (req) => lagKort(await lesKropp(req))],
  ["GET", /^\/api\/kort\/([\w-]+)$/, (_, [id]) => kortStatus(id)],
  ["POST", /^\/api\/kort\/([\w-]+)\/si-opp$/, (_, [id]) => siOppKort(id)],
  ["POST", /^\/api\/kassa$/, () => visIKassa()],
  ["GET", /^\/api\/kassa\/([\w-]+)$/, (_, [id]) => kassaSvar(id)],
];

createServer(async (req, res) => {
  const sti = new URL(req.url, "http://x").pathname;
  try {
    if (req.method === "GET" && sti === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(await readFile(new URL("./index.html", import.meta.url)));
    }
    for (const [metode, monster, handling] of ruter) {
      const treff = req.method === metode && sti.match(monster);
      if (treff) {
        const svar = await handling(req, treff.slice(1));
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(svar));
      }
    }
    res.writeHead(404).end();
  } catch (feil) {
    console.error("  ✗", feil.message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ feil: feil.message }));
  }
})
  .on("error", (feil) => {
    if (feil.code !== "EADDRINUSE") throw feil;
    console.error(`\n  Port ${PORT} er opptatt. Stopp det som kjører der, eller velg en annen: PORT=3334 npm start\n`);
    process.exit(1);
  })
  .listen(PORT, "127.0.0.1", () => {
  console.log(`\n  ☕ Kafé Kos er åpen på http://localhost:${PORT}\n`);
  sorgForOppsett().catch((feil) => console.error("  ✗ Oppsettet feilet:", feil.message));
});
