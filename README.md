# 🎾 Padely - Padel Live Scores (React Native / Expo)

Applicazione mobile in **React Native** con **Expo** (TypeScript) che replica fedelmente le funzionalità e l'interfaccia dell'applicazione Android **Padely - Padel Live Scores (v2.0.0)**.

Progetto realizzato a scopo di apprendimento ed uso personale.

---

## 🚀 Avvio Rapido

Per avviare l'applicazione in modalità sviluppo:

```bash
# Avvia il server di sviluppo Expo
npx expo start
```

Da qui puoi:
- Premere **`a`** per avviare l'emulatore Android.
- Premere **`w`** per visualizzare l'app nel browser web.
- Inquadrare il QR code con l'app **Expo Go** sul tuo smartphone (iOS o Android).

---

## 🔍 Riepilogo del Reverse Engineering & Funzionamento API

L'analisi dei binari Android (`classes.dex`, `classes2.dex`, `classes3.dex`) e dei file AXML ha permesso di estrarre:

### 1. Sorgenti Dati & API Gratuite
Tutte le API utilizzate sono **completamente gratuite**, pubbliche e non richiedono alcuna chiave a pagamento o abbonamento:

1. **Tornei, Partite Live e Schede Giocatore** (`http://fredericosilva.net:8081`):
   - `GET /padely/events`: Elenco tornei mondiali FIP e Premier Padel (titolo, cover, date, location).
   - `GET /padely/event?id={id}&day={day}&utcOffset={utcOffset}`: Incontri del giorno con punteggi live dei set, punti correnti del game (`15`, `30`, `40`, `AD`), indicatore del servizio (`isServing`), vincitori e walkover.
   - `GET /padely/match_stats?matchId={matchId}&eventId={eventId}`: Statistiche avanzate di servizio, risposta, break point e serie.
   - `GET /padely/player?handler={handler}`: Scheda biografica, compagno di squadra e statistiche di rendimento stagionali.
   - **Nota Tecnica**: Il backend Jetty richiede tassativamente l'header `User-Agent: okhttp/4.12.0` (già configurato nel client [client.ts](file:///c:/Users/lenovo/Desktop/Ele/projects/padel-score/src/api/client.ts)).

2. **Classifiche Ufficiali FIP Dirette** (`https://www.padelfip.com/wp-json/fip/v1`):
   - `GET /ranking/load-more?gender=male|female&year=2026&circuit=fip`: Classifica ufficiale FIP maschile e femminile in tempo reale con delta posizioni, punti, foto e bandiere nazionali.
   - `GET /player/search`: Ricerca istantanea giocatori.

3. **Notizie e Aggiornamenti** (`GET /padely/news?locale=it`):
   - Aggregazione e parsing automatico di feed RSS ufficiali (FIP, PadelAddict) con anteprime e apertura nel browser.

---

## 📱 Schermate e Funzionalità Implementate

1. **Tornei (Home)**:
   - Sezione **"In Corso Ora"** (Live Now) per i tornei attivi con badge live pulsante.
   - Sezione **"Prossimi Tornei"** (Up Next) e **"Tornei Conclusi"** (Past).
   - Ricerca per nome torneo o città.
   - Fogli modali per il filtro per categoria torneo (Premier Major, P1, P2, FIP Platinum, Gold, Star, Bronze, ecc.) e informazioni About.

2. **Dettaglio Torneo & Tabellone Partite**:
   - Barra orizzontale dei giorni calcolata dinamicamente (`Day 1`, `Day 2`, ..., con selezione automatica del tab **"TODAY"** se in corso).
   - Switch per filtrare tra Uomini, Donne e Tutti.
   - Ricerca rapida per giocatore o turno.
   - Card incontro con giocatori, bandiere, battuta con pallina da padel, punteggi per set e punti del game in corso in evidenza dorata.
   - Polling automatico ogni 20 secondi per gli aggiornamenti live.

3. **Dettaglio Partita & Statistiche Live**:
   - Scoreboard completo con indicatore battuta e durata dell'incontro.
   - Tab di selezione: **Match**, **Set 1**, **Set 2**, **Set 3**.
   - Barre di confronto statistiche testa a testa (Aces, Doppi Falli, Punti Vinti al Servizio/Risposta, Break Point Convertiti, Serie più lunga).

4. **Classifiche FIP**:
   - Tab switch istantaneo Uomini / Donne.
   - Scorrimento infinito con caricamento automatico progressivo (20 giocatori per volta).
   - Indicatore visivo variazione ranking (verde `+`, rosso `-`, grigio `=`).
   - Ricerca integrata per nome giocatore.

5. **Profilo Giocatore**:
   - Foto, bandiera, paese, posizione e punteggio FIP.
   - Dati anagrafici (data di nascita, luogo, altezza, posizione Drive/Revés, coach).
   - Compagno di squadra interattivo (toccare il compagno apre direttamente il suo profilo).
   - Box statistiche di rendimento (partite vinte/perse, % efficacia, miglior ranking, race).

6. **Notizie**:
   - Feed notizie padel sincronizzato da feed RSS ufficiali.
   - Switch lingua (`IT`, `ES`, `EN`).
   - Apertura articoli con formattazione pulita nel browser.

---

## 🛠️ Architettura del Codice

```
src/
 ├── api/                       # Client HTTP e chiamate API
 │    ├── client.ts             # Client fetch con header OkHttp e FIP direct
 │    ├── events.ts             # Tornei, partite e statistiche
 │    ├── rankings.ts           # Classifiche e schede anagrafiche giocatori
 │    └── news.ts               # Notizie e parser RSS
 ├── components/
 │    ├── common/               # Badge, FilterModal, AboutModal
 │    ├── tournament/           # TournamentCard, MatchCard, DayTabs
 │    ├── match/                # StatBar (confronto visivo statistiche)
 │    └── ranking/              # PlayerRow (riga classifica con delta e foto)
 ├── navigation/
 │    ├── BottomTabNavigator.tsx# Tab Tornei, Classifiche, Notizie
 │    └── RootNavigator.tsx     # Native Stack Navigation
 ├── screens/
 │    ├── HomeScreen.tsx
 │    ├── TournamentScreen.tsx
 │    ├── MatchScreen.tsx
 │    ├── RankingsScreen.tsx
 │    ├── ProfileScreen.tsx
 │    └── NewsScreen.tsx
 ├── store/
 │    └── usePreferencesStore.ts# Stato Zustand con persistenza AsyncStorage
 ├── types/
 │    ├── models.ts             # Tipizzazione TypeScript completa di tutti i modelli
 │    └── navigation.ts         # Tipizzazione rotte di navigazione
 └── utils/
      ├── date.ts               # Parsing date DD/MM/YYYY, calcolo giorni e offset UTC
      └── theme.ts              # Palette colori (Men Blue, Women Pink, Live Red, Gold)
```
