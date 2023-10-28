# Område Helse Helsesjekk 🤖

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

## Jeg vil utvikle på den!

Uff! Dumt for deg! Men det er håp. Det er noen steg du må gjennom.

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
    docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 -it postgres:14
    ```
5. Kjør prisma-migreringene mot databasen:
    ```bash
    npx prisma migrate dev
    ```
6. Endelig kan vi starte development-serveren:
    ```bash
    yarn dev
    ```

Utviklingsflyten vil være å interaktere med slack botten gjennom ditt private slack workspace. F.eks. ved å legge botten til som en integrasjon på en testkanal, kjøre /helsesjekk i den kanalen, og fylle ut helsesjekken.

Det er noen verktøy i [./src/commands/commands-handler.ts](src/bot/commands/commands-handler.ts) som kan være nyttige for å teste ut funksjonalitet. F.eks. kan du kjøre `/helsesjekk test` for triggre ting som eller ser cron-basert.

Ikke nøl med å ta kontakt på #helsesjekk-bot på NAV-IT slacken om du trenger hjelp!
