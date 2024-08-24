# Helsesjekk Bot 🤖

# Hva er det?

Dette er en Slack-bot som spør et par enkle spørsmål til medlemmene i kanalen en gang uken.

![image](https://github.com/navikt/helsesjekk-bot/assets/1507032/a8e5c17e-2edb-450e-87a9-80967a16eec6)

Når helsesjekken stenges, så vil man få sammensatte tall på hvordan teamet har det. Selve svarene er anonyme.

![image](https://github.com/navikt/helsesjekk-bot/assets/1507032/2d18fb32-f682-4dd0-89c0-06d961aa6e86)

![image](https://github.com/navikt/helsesjekk-bot/assets/1507032/e28d81a6-56ed-45fa-93f7-43599754bfa9)

# Er du NAV ansatt?

## Jeg vil bruke den!

Så bra! Gå til ditt team sin private team kanal (ikke den store, åpne kanalen som alle har tilgang til), også legger du til botten som en integrasjon.

![image](https://user-images.githubusercontent.com/1507032/215116406-0345c992-4573-49c3-ab43-77c6a11740a5.png)

Søk opp integrasjonen, den heter "Helsesjekk":

![image](https://user-images.githubusercontent.com/1507032/215116765-27af786f-e3c1-411a-b3f0-5b1aa38344cc.png)

Det siste du må gjøre er å skrive /helsesjekk i kanalen, da får du tilgang til å gi teamet ditt et navn, samt fortelle botten når du vil at helsesjekken skal postes!

![image](https://user-images.githubusercontent.com/1507032/215425212-ac800637-4f73-4ad3-ad9d-b3d0a2011e37.png)

![image](https://user-images.githubusercontent.com/1507032/215425338-4c307c6d-e00d-4972-a500-7a0733d7783f.png)

## Jeg fant noe feil!

Ta kontakt på #helsesjekk-bot på NAV-IT slacken!

# Utenfor NAV

Botten er hostet som en intern app på NAV sin IT-plattform. Selve bot-brukeren er en intern slack-app.

Dersom du ønsker å bruke botten, kan du ta sette opp din egen bot-bruker på din Slack ved å bruke [slack-manifest.yml](./slack-manifest.yml) som utgangspunkt.

Når det kommer til selve botten, så kan du gjøre følgende:

1. Fork dette Github-repoet
2. Fjern filene:
    1. nais.yml og nais-dev.yaml
3. Konfigurer opp en egen CI/CD-løsning for å deploye botten i [deploy.yaml](./.github/workflows/deploy.yaml)
4. Konfigurer opp [env.ts](./src/utils/env.ts) med miljøvariablene din platform trenger
5. Tweak [authentication.ts](./src/auth/authentication.tsx) og [ms-graph.ts](./src/auth/ms-graph.ts) til å fungere med deres env løsning.
    1. For eksempel libben som er brukt her, @navikt/next-auth-wonderwall har en sterk kobling til NAV sin applikasjonsplatform, og er ikke noe dere kan gjenbruke.

Det er sikkert andre ting som må justeres på også.

# Jeg vil utvikle på den!

### Avhengigheter

Noen av bottens avhengigheter er hostet her på Github. Github tillatter ikke anonyme pulls av pakker fra Github Package Registry.

For å kunne installere avhengighetene må du opprette en Personal Access Token (PAT), som beskrevet her:

-   https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic

Denne PAT-en skal _kun_ ha tilgangen `package:read`. Sett denne PAT-en som miljøvariabel på maskinen din.

`export NPM_AUTH_TOKEN=<tokenet du nettopp genererte>`

i enten `.bashrc` eller `.zshrc` (avhengig av ditt shell).

Du skal nå kunne kjøre `yarn` for å installere avhengighetene uten 401-feil.

### Utvikle selve botten:

1. Først så trenger du ditt helt eget slack workspace du har admin tilgang til.
2. Deretter kan du opprette en ny bot i Slack, bruk slack-manifest.yml i dette repoet til å kickstarte alle permissions du trenger.
3. Opprett en `.env`-fil på rot i repoet, og legg til følgende:
    ```env
    NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
    SLACK_SIGNING_SECRET=<secret>
    SLACK_BOT_TOKEN=<secret>
    SLACK_APP_TOKEN=<secret>
    ```
4. Start opp en lokal postgres-database:
    ```bash
    yarn dev:db
    ```
5. Kjør prisma-migreringene mot databasen:
    ```bash
    yarn prisma:migrate-dev
    ```
6. Endelig kan vi starte development-serveren:
    ```bash
    yarn dev
    ```
7. Gjør en curl request mot `/api/internal/is_ready` for å starte slack-integrasjonen.
    ```bash
    curl -X GET http://localhost:3000/api/internal/is_ready
    ```

Utviklingsflyten vil være å interaktere med slack botten gjennom ditt private slack workspace. F.eks. ved å legge botten til som en integrasjon på en testkanal, kjøre /helsesjekk i den kanalen, og fylle ut helsesjekken.

Det er noen verktøy i [./src/commands/commands-handler.ts](src/bot/commands/commands-handler.ts) som kan være nyttige for å teste ut funksjonalitet. F.eks. kan du kjøre `/helsesjekk test` for triggre ting som eller ser cron-basert.

### Utvikle Dashboardet

Dette er litt enklere å jobbe med.

1. Opprett en `.env`-fil på rot i repoet, og legg til følgende:
    ```env
    NAIS_DATABASE_HELSESJEKK_BOT_HELSESJEKK_BOT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
    ```
2. Start opp en lokal postgres-database:
    ```bash
    yarn dev:db
    ```
3. Kjør prisma-migreringene mot databasen:
    ```bash
    yarn prisma:migrate-dev
    ```
4. Seed databasen:
    ```bash
    yarn prisma:seed
    ```
5. Kjør opp nextjs dev server:
    ```bash
    yarn dev
    ```

Besøk [localhost:3000](http://localhost:3000) for å se dashboardet.

Ikke nøl med å ta kontakt på #helsesjekk-bot på NAV-IT slacken om du trenger hjelp!
