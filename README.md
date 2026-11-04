# PadelLive

Applicazione mobile open source per il monitoraggio in tempo reale dei tornei di padel mondiali, risultati live, tabelloni, statistiche di gioco, classifiche ufficiali FIP e notizie.

Sviluppata con React Native ed Expo in TypeScript, PadelLive e' progettata con un'architettura client-side che interagisce direttamente con i dati ufficiali di tornei e circuiti internazionali (Premier Padel e FIP Tour), senza intermediari proprietari e nel pieno rispetto della privacy degli utenti.

---

## Download e Installazione Android (APK)

L'applicazione e' distribuita direttamente tramite pacchetto APK standalone, scaricabile gratuitamente dalla sezione Releases di GitHub, senza necessita' di passare dal Google Play Store.

### Requisiti di Sistema
- Dispositivo Android con versione 8.0 (Oreo) o successiva.
- Circa 40 MB di spazio libero in memoria.

### 1. Download del file di installazione
1. Apri la pagina delle Release su GitHub dal browser del tuo smartphone:
   `https://github.com/<TUO-USERNAME>/<TUO-REPOSITORY>/releases/latest`
2. Nella sezione **Assets**, tocca il file **`PadelLive.apk`** per avviare il download.

### 2. Abilitazione delle Origini Sconosciute (Installa app sconosciute)
A partire da Android 8.0, Google gestisce i permessi di installazione per singola applicazione (ad esempio Google Chrome, Firefox, Samsung Internet o l'app File/Gestione File). Al primo tentativo di apertura dell'APK scaricato:

1. Quando il download e' completato, tocca la notifica di download oppure apri l'app **File / Download** e tocca il file `PadelLive.apk`.
2. Se il sistema mostra il messaggio di avviso:
   > "Per motivi di sicurezza, il telefono non e' autorizzato a installare app sconosciute da questa fonte"
3. Tocca **Impostazioni** (o **Dettagli**).
4. Attiva l'interruttore su **Consenti da questa fonte** (o **Consenti installazione di app sconosciute**).
5. Premi il tasto Indietro del telefono e tocca **Installa**.

### 3. Gestione avviso Google Play Protect
Poiche' l'applicazione e' distribuita in formato open source direttamente dalla community e non tramite i server commerciali di Google, durante l'installazione Google Play Protect potrebbe mostrare una schermata informativa ("App bloccata da Play Protect" o "Sviluppatore non riconosciuto"):

1. Nella finestra di avviso, tocca la voce **Ulteriori dettagli** (oppure **Maggiori informazioni**).
2. Tocca il pulsante **Installa comunque**.
3. Al termine dell'installazione tocca **Apri** per avviare PadelLive.

---

## Funzionalita

- **Monitoraggio Tornei**:
  - Visualizzazione tornei In Corso, Prossimi e Conclusi dei circuiti Premier Padel e FIP.
  - Filtro dinamico per categoria (Major, P1, P2, Platinum, Gold, Star, Rise, Promotion).
  - Ricerca rapida per nome torneo o localita.
- **Risultati e Partite Live**:
  - Scoreboard in tempo reale con punteggio dei set e game in corso (15, 30, 40, AD).
  - Indicatore visivo del turno di servizio.
  - Statistiche dettagliate della partita (break point convertiti, aces, doppi falli, efficacia servizio/risposta).
  - Aggiornamento automatico e polling intelligente durante gli incontri attivi.
- **Tabelloni Torneo (Draws)**:
  - Tabellone completo maschile e femminile suddiviso per turni (Trentaduesimi, Sedicesimi, Ottavi, Quarti, Semifinali, Finale).
  - Consultazione tabellone interattivo o download del PDF ufficiale.
- **Dirette Streaming e Info Canali**:
  - Link diretto alle dirette ufficiali (canali YouTube ufficiali e piattaforme broadcaster autorizzate).
  - Scheda informativa integrata sui diritti di trasmissione per nazione.
- **Giocatori Preferiti e Notifiche**:
  - Salvataggio dei giocatori preferiti con un tocco.
  - Notifiche locali per inizio partita, fine set e fine match dei tuoi atleti preferiti.
  - Filtro istantaneo per vedere unicamente le partite dei tuoi atleti preferiti nei tornei.
- **Classifiche Mondiali FIP**:
  - Ranking ufficiale maschile e femminile aggiornato.
  - Delta posizioni rispetto all'aggiornamento precedente.
  - Ricerca per nome atleta o nazione.
  - Scheda dettagliata del giocatore con statistiche di rendimento, partner abituale e dati anagrafici.
- **Notizie e Aggiornamenti**:
  - Feed notizie sincronizzato con fonti giornalistiche ufficiali di padel.
  - Traduzione e supporto multilingua (Italiano, Spagnolo, Inglese).
- **Personalizzazione**:
  - Supporto completo Tema Scuro (Dark Mode) e Tema Chiaro (Light Mode).
  - Persistenza automatica di filtri, tab selezionati e preferenze di notifica.

---

## Architettura e Privacy

L'applicazione e' concepita secondo il principio della decentralizzazione:
- **Nessun account obbligatorio**: l'app e' immediatamente pronta all'uso senza registrazione.
- **Zero profilazione**: le preferenze, i giocatori seguiti e le impostazioni restano confinati nella memoria locale del dispositivo tramite AsyncStorage.
- **Connessione diretta alle fonti**: i dati delle partite e le classifiche vengono interrogati direttamente dai feed e provider dei circuiti sportivi ufficiali.

```
src/
 |-- api/             # Client HTTP e connettori verso le sorgenti dati
 |-- components/      # Componenti modulari (tornei, partite, classifiche, modali)
 |-- i18n/            # Internazionalizzazione (IT, ES, EN)
 |-- navigation/      # Navigazione nativa a schede e stack
 |-- screens/         # Schermate principali dell'applicazione
 |-- services/        # Gestori notifiche, tracker punteggi e tabelloni
 |-- store/           # Gestione stato globale persistente (Zustand + AsyncStorage)
 |-- types/           # Modelli di dati TypeScript
 |-- utils/           # Funzioni di utilita data, testo e temi
```

---

## Sviluppo Locale

### Prerequisiti
- Node.js (versione 18.x o successiva)
- npm oppure bun
- Dispositivo Android con debug USB attivo o emulatore Android Studio (opzionale per sviluppo con client nativo)
- App **Expo Go** per test rapidi

### Installazione ed Esecuzione
1. Clonare il repository:
   ```bash
   git clone https://github.com/<TUO-USERNAME>/<TUO-REPOSITORY>.git
   cd <TUO-REPOSITORY>
   ```

2. Installare le dipendenze:
   ```bash
   npm install
   ```

3. Avviare il server di sviluppo:
   ```bash
   npx expo start
   ```

4. Controlli di qualita del codice:
   ```bash
   # Verifica dei tipi TypeScript
   npx tsc --noEmit

   # Analisi statica con linter
   npx expo lint
   ```

---

## Compilazione APK di Produzione

Il progetto e' gia predisposto con Expo Application Services (EAS) per generare direttamente pacchetti APK standalone (senza necessita del formato AAB di Google Play).

### Compilazione via EAS Cloud
1. Installare la CLI di EAS se non presente:
   ```bash
   npm install -g eas-cli
   ```

2. Effettuare l'accesso con un account Expo (gratuito):
   ```bash
   eas login
   ```

3. Lanciare la compilazione del pacchetto APK:
   ```bash
   eas build -p android --profile production
   ```
   Al termine del processo verra fornito il link diretto per scaricare il file APK compilato.

### Compilazione Locale (senza cloud)
Se disponi di Android SDK e Java (JDK 17+) configurati localmente:
```bash
eas build -p android --profile production --local
```

---

## Distribuzione Alternativa Consigliata

Oltre alla pubblicazione diretta nelle **GitHub Releases**, il progetto puo essere inserito nei repository aperti della comunita Android per consentire agli utenti di ricevere aggiornamenti automatici:

1. **IzzyOnDroid (F-Droid Community)**:
   - E' il piu grande repository curato compatibile con i client F-Droid, Neo Store e Droid-ify.
   - Non richiede di ricompilare il codice: monitora automaticamente le Releases del tuo repository GitHub e rende disponibile l'APK agli utenti.
   - Per richiedere l'inserimento e' sufficiente aprire una richiesta su GitLab all'indirizzo `https://gitlab.com/IzzyOnDroid/repo/-/issues` indicando il link del repository GitHub.

2. **GitHub Releases Badge**:
   - E' possibile aggiungere un badge di download diretto per consentire agli utenti di ottenere sempre l'ultima versione stabile con un solo click.

---

## Licenza

Questo progetto e' rilasciato sotto licenza **MIT**. Consulta il file [LICENSE](LICENSE) per i termini completi.
