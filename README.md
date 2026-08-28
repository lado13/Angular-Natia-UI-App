# Natia UI App

Real-time broadcast operations dashboard built with **Angular 17**.

Natia monitors TV channels, satellite transponders, EMR temperatures, power state, harmonics, region relays, and related alerts live over **SignalR**, with REST fallbacks for initial load and system stream details.

---

## Overview

Natia UI is an operations screen for broadcast/monitoring teams. It shows live health of channels and satellites, room/EMR temperatures, electricity/generator status, engineers on shift, weather, bus arrivals, harmonic systems, and problem lists — updating without a full page reload.

The UI also supports seasonal theming:

- **Day / Night** background (by local time)
- **Christmas theme** (8 November – 30 January): snow, festive decorations, Christmas videos, and seasonal robot GIF

---

## Features

### Live monitoring
- TV channel list with success / warn / error / disabled states
- Channel detail hover tooltip (HTML from API)
- Satellite cards with SymbolRate + MER status
- Optic channel problems table
- IP channel problems (dynamic columns from SignalR payload)
- Cards that need activation
- Region relay MER / warning status
- EMR temperature Hot / Warm / Normal
- Harmonic systems ON/OFF, reserve, alarm counts
- Main power + generator indicators
- Engineers on shift (photo + name)
- Weather widget
- Bus arrival cards
- Robot speech messages and disco animations from SignalR

### Theming
- Automatic **day theme** (`11:00–16:59`) and **night theme** (other hours)
- Automatic **Christmas season** (`8 Nov` → `30 Jan`)
  - Snow animation
  - Festive UI decorations
  - Day/night Christmas background videos
  - Robot GIF switches to `assets/gif/sports-sportsmanias.gif`

### UX
- Responsive layout for tablet and mobile
- Soft status pulse animations (shared CSS variables; softer on wide satellite badges)
- Reload control and periodic theme re-check

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Framework | Angular 17 (standalone components) |
| Language | TypeScript |
| Styling | SCSS + Bootstrap 5 |
| Real-time | `@microsoft/signalr` |
| HTTP | Angular `HttpClient` |
| Reactive | RxJS |
| SSR | Angular SSR / Express (optional) |

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `NatiaComponent` | Main live dashboard |
| `/system-streams` | `SystemStreamInfoComponent` | System stream / program bitrate details |

---

## Project Structure

```text
src/
├── app/
│   ├── natiaUI/natia/              # Main dashboard (HTML/SCSS/TS)
│   ├── system-stream-info/         # System streams page
│   ├── app.routes.ts
│   ├── app.config.ts
│   └── app.component.*
├── service/
│   ├── signal-rservice.service.ts  # SignalR hub listeners + streams
│   ├── channel-service.service.ts  # REST: channels/satellites/details
│   ├── system-stream-info.service.ts
│   └── theme-service.service.ts    # Day/night + Christmas theme
├── model/                          # TypeScript interfaces
├── environments/
│   ├── environment.ts              # Development endpoints
│   └── environment.prod.ts         # Production endpoints
└── assets/                         # Images, gifs, videos, fonts, svg
```

---

## Real-time SignalR Events

Hub URL comes from `environment.signalRHubUrl`.

| Hub event | UI purpose |
|-----------|------------|
| `temperatureUpdate` | Server room temperature / humidity |
| `chanellInfoUpdate` | Channel list / error flags |
| `satelliteMonitoringUpdate` | Satellite SymbolRate / MER |
| `OpticChannelHealthUpdate` | Problematic optic channels |
| `IpChannelProblemsUpdate` | IP channel problems (dynamic fields) |
| `CardsWhichNeedToBeActivate` | Cards pending activation |
| `regionbitrateupdate` | Region relay MER / warnings |
| `emrTemperatureUpdate` | EMR site temperatures |
| `electricityinfo` | City power + generator |
| `harmonicinfo` | Harmonic systems |
| `enginnersonshift` | Engineers currently on shift |
| `weatherUpdate` | Weather widget |
| `autoArrivalUpdate` | Bus arrivals |
| `robotsay` | Robot speech bubble |
| `StartAnimate` | Disco / greeting animations |

---

## REST APIs

Configured in `src/environments/environment.ts`:

```ts
apiUrl:              '.../Unite/api/'
signalRHubUrl:       '.../UniteHub'
systemStreamInfoApi: '.../api/ExcelData/SystemStreamInfo'
channelDetailsApi:   '.../api/ChanellDetails/GetChanellDetailsAsHtml?name='
```

| Call | Usage |
|------|--------|
| `GET {apiUrl}GetDataForUI` | Initial channels + satellites + temperature |
| `GET {channelDetailsApi}{name}` | Channel hover HTML details |
| `GET {systemStreamInfoApi}` | System stream info page |

> Note: System Stream Info may return HTTP `404` with `"No system stream info available in cache."` when the backend cache is empty. The UI treats that as an empty list and retries.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Angular CLI 17 (`npm i -g @angular/cli`)
- Access to backend APIs / SignalR hub on the local network

### Install

```bash
npm install
```

### Run (development)

```bash
ng serve
```

Then open `http://localhost:4200/`.

On Windows PowerShell, if `ng` is blocked by execution policy, use:

```powershell
ng.cmd serve -o
```

Or:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Build

```bash
ng build
```

Production output: `dist/natia-ui-app/`

### SSR (optional)

```bash
npm run serve:ssr:Natia-UI-App
```

---

## Configuration

Edit endpoints before deploy:

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

Keep `apiUrl`, `signalRHubUrl`, `systemStreamInfoApi`, and `channelDetailsApi` pointing at reachable servers.

---

## Theme Rules

### Day / Night
- Day: local hour `>= 11` and `< 17`
- Night: all other hours
- Body classes: `day-theme` / `night-theme`

### Christmas
- Active from **8 November** through **30 January**
- Body class: `christmas-theme`
- Theme is re-checked periodically and when the tab becomes visible again

#### Quick Christmas test without waiting for November
Temporarily in `theme-service.service.ts`:

```ts
isChristmasSeason(date: Date = new Date()): boolean {
  return true; // TEST ONLY
  // ...
}
```

Or change the Windows system date to **8 November** and hard-refresh (`Ctrl+F5`).

Remember: JavaScript months are **0-based** (`November = 10`, `December = 11`, `August = 7`).

---

## Status Colors

| Class | Meaning |
|-------|---------|
| `natia-success` | OK / normal |
| `natia-warn` | Warning / warm / low bitrate |
| `natia-error` / `natia-temp-error` | Error / hot / critical |
| `natia-test` | Disabled / test channel |

Animations use a shared `statusPulse` keyframe with CSS variables. Satellite badges use a softer pulse so wide full-width cells do not look harsher than other widgets.

---

## Screenshots

Place screenshots under `src/screenshots/` (or update paths below):

![Screenshot 1](/src/screenshots/Screenshot1.png)
![Screenshot 2](/src/screenshots/Screenshot2.png)
![Screenshot 3](/src/screenshots/Screenshot3.png)
![Screenshot 4](/src/screenshots/Screenshot4.png)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` / `ng serve` | Dev server |
| `ng build` | Production build |
| `ng test` | Unit tests (Karma/Jasmine) |
| `npm run serve:ssr:Natia-UI-App` | Serve SSR build |

---

## Notes

- Designed for always-on operations displays (NOC / broadcast room screens).
- SignalR reconnect is enabled with backoff.
- Mobile/tablet layouts convert many absolute desktop panels into stacked flow.
- Christmas assets (videos/gifs/images) must exist under `src/assets/`.

---

## License

Private project (`"private": true` in `package.json`).
