
import { Component, OnInit, ChangeDetectorRef, NgZone, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelServiceService } from '../../../service/channel-service.service';
import { SignalRService } from '../../../service/signal-rservice.service';
import { Satellite } from '../../../model/satellite';
import { SatelliteDetail } from '../../../model/satellite-detail';
import { TemperatureInfo } from '../../../model/temperature-info';
import { TVChannel } from '../../../model/tvchannel';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { ThemeServiceService } from '../../../service/theme-service.service';
import { OpticChannelProblem } from '../../../model/optic-channel-problem';
import { CardInfoToActivate } from '../../../model/card-info-to-activate';
import { RegionRelay } from '../../../model/region-relay';
import { DiscoMessage } from '../../../model/disco-message';
import { EmrTemperature } from '../../../model/emr-temperature';
import { RouterModule } from '@angular/router';
import { Snowflake } from '../../../model/snowflake';
import { Router } from '@angular/router';
import { WeatherUpdate } from '../../../model/weather-update';
import { BusArrival } from '../../../model/bus-arrival';
import { ElectricityInfo } from '../../../model/electricity-info';
import { HarmonicSystem } from '../../../model/harmonic-system';
import { EngineerOnShift } from '../../../model/engineer-on-shift';
import { IpChannelProblem } from '../../../model/ip-channel-problem';

//system stream
declare var webkitSpeechRecognition: any;

type FunnyAnimKind = 'cross' | 'cross-reverse' | 'fly' | 'peek';
type PeekCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface FunnyAnimation {
  id: string;
  src: string;
  kind: FunnyAnimKind;
  durationMs: number;
  alt: string;
  corner?: PeekCorner;
}

@Component({
  selector: 'app-natia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './natia.component.html',
  styleUrls: ['./natia.component.scss']
})
export class NatiaComponent implements OnInit {

  //api channels
  channels: TVChannel[] = [];

  //sattelite
  satellites: Satellite[] = [];

  //server room temperature
  temperatureInfo!: TemperatureInfo;

  //channels signalr
  opticChannels$!: Observable<OpticChannelProblem[]>;
  ipChannels$!: Observable<IpChannelProblem[]>;

  //card how need activate
  cards$!: Observable<CardInfoToActivate[]>;

  //region relay db
  regionRelays: RegionRelay[] = [];

  //natia voice text
  robotSpeech: string | null = null;

  //natia aniamtion
  currentMessage: DiscoMessage | null = null;
  currentAnimation: string | null = null;

  //emr temeperature
  emrtemperature: EmrTemperature[] = [];

  // Weather updates
  weatherList: WeatherUpdate[] = [];
  isWeatherLoading = true; // loading indicator

  // random funny animations — add more items here
  private readonly funnyAnimations: FunnyAnimation[] = [
    { id: 'duck', src: 'assets/gif/duck2.gif', kind: 'cross', durationMs: 40000, alt: 'Duck' },
    { id: 'bat', src: 'assets/gif/bat-paniki.gif', kind: 'fly', durationMs: 40000, alt: 'Bat' },
    { id: 'squad', src: 'assets/gif/squad-team.gif', kind: 'cross', durationMs: 40000, alt: 'Squad' },
    { id: 'peek', src: 'assets/gif/pengu-pudgy.gif', kind: 'peek', durationMs: 8000, alt: 'Spy penguin' },
    { id: 'gossip', src: 'assets/gif/gasp-gossip.gif', kind: 'peek', durationMs: 8000, alt: 'Shhh penguin' },
    { id: 'tiger', src: 'assets/gif/tiger.gif', kind: 'cross', durationMs: 20000, alt: 'Tiger' },
    { id: 'car', src: 'assets/gif/car-cute.gif', kind: 'cross-reverse', durationMs: 60000, alt: 'Car' },
  ];
  private readonly peekCorners: PeekCorner[] = ['bottom-left', 'bottom-right'];
  currentFunny: FunnyAnimation | null = null;
  private lastFunnyId: string | null = null;
  private funnyQueue: FunnyAnimation[] = [];
  private funnyShowTimer: ReturnType<typeof setTimeout> | null = null;
  private funnyWaitTimer: ReturnType<typeof setTimeout> | null = null;

  christmasGreeting = [
    { text: 'გისურვებთ', heart: false },
    { text: 'ბედნიერ', heart: false },
    { text: 'შობა', heart: false },
    { text: 'ახალ', heart: false },
    { text: 'წელს', heart: false },
    { text: '♥', heart: true },
    { text: '♥', heart: true },
    { text: '♥', heart: true }
  ];

  private readonly robotGifDefault = 'assets/gif/boolb-robot.gif';
  private readonly robotGifChristmas = 'assets/gif/sports-sportsmanias.gif';

  private readonly discoAnimations: Record<string, string> = {
    Morning: 'assets/gif/morning.gif',
    Evening: 'assets/gif/evening.gif',
    Night: 'assets/gif/night.gif',
    Afternoon: 'assets/gif/afternoon.gif',
    birthday: 'assets/gif/birthday.gif',
    NatiasCpuOverload: 'assets/gif/overthinking-problem.gif',
    NatiasRamOverload: 'assets/gif/cpu.gif',
    TemperatureProblem: 'assets/gif/temperature.gif'
  };

  //snow flakes
  currentTime: Date = new Date();
  private timer: any;
  private themeTimer: any;
  newYearActive = false;
  private snowAnimating = false;
  snowflakes: Snowflake[] = [];

  //channels detail info
  hoverHtml: string | null = null;
  hoverX = 0;
  hoverY = 0;
  private hoverChannelName: string | null = null;
  private detailsSub?: Subscription;


  // //voice command prop system stream
  // recognition: any;
  // isListening = false;
  // status = "Stopped";
  // lastCommand = "";

  ////Bus Arrival
  buses: BusArrival[] = [];

  // ⚡ Electricity info
  electricity: ElectricityInfo[] = [];

  harmonicSystems: HarmonicSystem[] = [];

  engineersOnShift: EngineerOnShift[] = [];


  // track which car is moving
  cars = {
    bmw: false,
    prius: false
  };




  constructor(
    private channelService: ChannelServiceService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private themeService: ThemeServiceService,
    private router: Router
  ) { }



  async ngOnInit(): Promise<void> {
    await this.loadDataWithRetry();
    await this.initSignalR();

    //channels with problem
    this.opticChannels$ = this.signalRService.opticChannelProblem$;
    this.ipChannels$ = this.signalRService.ipChannelProblem$;

    //card activate
    this.cards$ = this.signalRService.cardInfo$;

    //funny animation
    this.startAnimationCycle();
    this.applyThemes();

    // re-check often so Windows date changes apply after refresh / while page stays open
    this.themeTimer = setInterval(() => {
      this.applyThemes();
    }, 30 * 1000);

    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);



    //present firework
    setInterval(() => {
      this.autoClickPresent();
    }, 3600000);


    // //input comand system stream
    // this.startVoice();


  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.themeTimer) {
      clearInterval(this.themeTimer);
    }
    this.detailsSub?.unsubscribe();
    if (this.funnyShowTimer) {
      clearTimeout(this.funnyShowTimer);
    }
    if (this.funnyWaitTimer) {
      clearTimeout(this.funnyWaitTimer);
    }
    this.stopNewYearAnimation();
  }

  get isChristmasTheme(): boolean {
    return this.themeService.christmasActive;
  }

  get robotGif(): string {
    return this.isChristmasTheme ? this.robotGifChristmas : this.robotGifDefault;
  }

  private applyThemes(): void {
    this.themeService.checkTimeAndSetTheme();
    this.syncChristmasEffects();
    this.cdr.detectChanges();
  }

  private syncChristmasEffects(): void {
    if (this.isChristmasTheme) {
      this.startNewYearAnimation();
    } else {
      this.stopNewYearAnimation();
    }
  }

  reload() {
    window.location.reload();
  }

  smokePuffs = Array(10);

  moveCar(car: 'bmw' | 'prius') {
    if (this.cars[car]) return;

    this.cars[car] = true;

    // reset after animation duration
    setTimeout(() => {
      this.cars[car] = false;
    }, 5000); // match CSS animation duration
  }



  // // Voice command Natia system stream (English only)
  // initVoice() {
  //   const SpeechRecognition = (window as any).SpeechRecognition || webkitSpeechRecognition;
  //   if (!SpeechRecognition) {
  //     console.error("SpeechRecognition not supported");
  //     return;
  //   }

  //   this.recognition = new SpeechRecognition();
  //   this.recognition.lang = "ka-GE"; // English
  //   this.recognition.continuous = true;
  //   this.recognition.interimResults = false;

  //   this.recognition.onresult = (event: any) => {
  //     const text = event.results[event.results.length - 1][0].transcript.trim();
  //     this.lastCommand = text;
  //     this.handleCommand(text);
  //   };

  //   this.recognition.onend = () => {
  //     if (this.isListening) {
  //       try { this.recognition.start(); } catch (e) { }
  //     }
  //   };
  // }

  // startVoice() {
  //   if (this.isListening) return;
  //   this.initVoice();
  //   try {
  //     this.recognition.start();
  //     this.isListening = true;
  //     this.status = "Listening...";
  //   } catch (e) {
  //     console.error("Voice start failed:", e);
  //   }
  // }

  // stopVoice() {
  //   if (!this.isListening) return;
  //   this.recognition.stop();
  //   this.isListening = false;
  //   this.status = "Stopped";
  // }

  // handleCommand(text: string) {
  //   const cmd = text.toLowerCase();

  //   if (cmd.includes("გახსენი სტრიმები") || cmd.includes("სტრიმი")) {
  //     this.openSystemStreams();
  //   }

  //   // if (cmd.includes("სტოპ")) {
  //   //   this.stopVoice();
  //   // }

  //   // if (cmd.includes('ჩაირთე')) {
  //   //   this.startVoice();

  //   // }

  //   if (cmd.includes("ცეცხლი") || cmd.includes("ფოიერვერკი")) {
  //     this.boom();
  //   }
  // }

  // openSystemStreams() {
  //   this.stopVoice();
  //   this.router.navigate(['/system-streams']); // Angular Router navigation
  // }




  //fanny animation
  startAnimationCycle() {
    if (this.funnyShowTimer) {
      clearTimeout(this.funnyShowTimer);
    }
    if (this.funnyWaitTimer) {
      clearTimeout(this.funnyWaitTimer);
    }

    if (this.funnyQueue.length === 0) {
      this.funnyQueue = [...this.funnyAnimations].sort(() => Math.random() - 0.5);
      if (this.funnyQueue.length > 1 && this.funnyQueue[0].id === this.lastFunnyId) {
        this.funnyQueue.push(this.funnyQueue.shift() as FunnyAnimation);
      }
    }

    const base = this.funnyQueue.shift() ?? this.funnyAnimations[0];
    const animation: FunnyAnimation = { ...base };
    if (animation.kind === 'peek') {
      animation.corner = this.peekCorners[Math.floor(Math.random() * this.peekCorners.length)];
    }

    const now = new Date();
    console.log(`🟢 Animation START: ${animation.id} (${animation.kind}) at ${now.toLocaleTimeString()}`);

    this.currentFunny = animation;
    this.lastFunnyId = animation.id;
    this.cdr.detectChanges();

    this.funnyShowTimer = setTimeout(() => {
      this.currentFunny = null;
      this.cdr.detectChanges();
      console.log(`🔴 Animation END: ${animation.id} at ${new Date().toLocaleTimeString()}`);

      this.funnyWaitTimer = setTimeout(() => {
        this.startAnimationCycle();
      }, 3600000);
    }, animation.durationMs + 200);
  }


  //default load api
  async loadDataWithRetry(retries = 3, delay = 2000): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {

        //channels
        const data = await firstValueFrom(this.channelService.getData());
        let rawChannels = data.ChanellInfo || [];
        if (!Array.isArray(rawChannels)) {
          rawChannels = [];
        }
        this.channels = rawChannels.map((item: any) => ({
          Order: item.order || item.Order,
          ChanellName: item.chanellName || item.ChanellName,
          HaveError: item.haveError !== undefined ? item.haveError : item.HaveError || false,
          IsDIsable: item.isDIsable !== undefined ? item.isDIsable : item.IsDIsable || false,
          status: item.status || item.Status
        }));

        //satellite
        let rawSatellites = data.SatelliteView || [];
        if (!Array.isArray(rawSatellites)) {
          rawSatellites = [];
        }
        this.satellites = rawSatellites.map((item: any) => ({
          Degree: item.degree || item.Degree,
          details: (item.details || []).map((detail: any) => ({
            Frequency: detail.frequency || detail.Frequency,
            SymbolRate: detail.symbolRate || detail.SymbolRate,
            Polarisation: detail.polarisation || detail.Polarisation,
            PortIn250: detail.portIn250 || detail.PortIn250 || 0,
            mer: detail.mer || detail.Mer || null,
            HaveError: detail.haveError !== undefined ? detail.haveError : detail.HaveError || false,
            HaveWarn: detail.haveWarn !== undefined ? detail.haveWarn : detail.HaveWarn || false
          }))
        }));

        //temperature
        this.temperatureInfo = data.TemperatureInfo || {};
        this.cdr.detectChanges();
        return;
      } catch (error) {
        console.error(`❌ Data load error (attempt ${attempt}/${retries}):`, error);
        if (attempt < retries) {
          // console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error('❌ Failed to load data after all retries');
    this.channels = [];
    this.satellites = [];
    this.cdr.detectChanges();
  }


  // Channel detail hover
  onChannelHover(name: string, event: MouseEvent) {
    event.stopPropagation();

    // same channel is already open — close it
    if (this.hoverChannelName === name && this.hoverHtml) {
      this.hoverHtml = null;
      this.hoverChannelName = null;
      this.detailsSub?.unsubscribe();
      return;
    }

    this.hoverX = event.clientX;
    this.hoverY = event.clientY;
    this.hoverChannelName = name;
    if (!this.hoverHtml) {
      this.hoverHtml = `<div class="hover-loading">Loading details for ${name}...</div>`;
    }

    this.detailsSub?.unsubscribe();
    this.detailsSub = this.channelService.getChannelDetails(name).subscribe({
      next: (html) => {
        if (this.hoverChannelName !== name) {
          return;
        }
        if (html && html.trim() !== '') {
          this.hoverHtml = html;
          // console.log(`✅ Channel details loaded for ${name}:`, html);
        } else {
          this.hoverHtml = `<b style='color:orange'>No details available for ${name}</b>`;
          console.warn(`⚠️ No details returned for ${name}`);
        }
      },
      error: (err) => {
        if (this.hoverChannelName !== name) {
          return;
        }
        console.error(`❌ Error loading channel details for ${name}:`, err);
        this.hoverHtml = `<b style='color:red'>Error loading details for ${name}</b>`;
      }
    });
  }


  //on click removes chanels details hover
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.channel-pill')) {
      return;
    }

    const tooltip = document.querySelector('.hover-tooltip-future');

    // hide only if click is OUTSIDE tooltip
    if (tooltip && !tooltip.contains(event.target as Node)) {
      this.hoverHtml = null;
      this.hoverChannelName = null;
      this.detailsSub?.unsubscribe();
    }
  }

  //signaler
  async initSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      console.log('📡 SignalR subscriptions initializing');
      this.ngZone.run(() => {

        let discoTimeout: any;

        // Disco animation
        this.signalRService.discoAnimation$.subscribe(msg => {
          // console.log('New disco message:', msg);
          if (msg?.message) {
            this.currentMessage = msg;
            this.setAnimation(msg.message);
            this.cdr.detectChanges();
            clearTimeout(discoTimeout);
            discoTimeout = setTimeout(() => {
              // console.log('🕛 Disco cleared after 10 seconds');
              this.currentMessage = null;
              this.currentAnimation = null;
              this.cdr.detectChanges();
            }, 50000);
          } else {
            this.currentMessage = null;
            this.currentAnimation = null;
            clearTimeout(discoTimeout);
            this.cdr.detectChanges();
          }
        });

        let robotTimeout: any;
        // ✅ 🤖 robotsay update
        this.signalRService.robotAudio$.subscribe(msg => {
          if (msg) {
            // console.log('🤖 Robot says:', msg);
            this.robotSpeech = msg;
            this.cdr.detectChanges();
            clearTimeout(robotTimeout);
            robotTimeout = setTimeout(() => {
              console.log('🕛 robotSpeech cleared after 10 seconds of no new messages');
              this.robotSpeech = null;
              this.cdr.detectChanges();
            }, 30000);
          }
        });

        //temperature
        this.signalRService.temperature$.subscribe(data => {
          if (data) {
            // console.log('🌡️ Temperature update received:', JSON.stringify(data, null, 2));
            this.temperatureInfo = { ...data };
            this.cdr.detectChanges();
          }
        });

        //chanell
        this.signalRService.chanellInfo$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            // console.log('%c📡 Channel info update received:', 'color: cyan;', JSON.stringify(data, null, 2));
            this.updateChannelsWithError(data);
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Invalid or empty chanellInfo data, skipping:', data);
          }
        });

        //satellite
        this.signalRService.satellite$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            // console.log('%c🛰️ Satellite update received:', 'color: blue;', JSON.stringify(data, null, 2));
            this.satellites = [...data];
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Invalid or empty satellite data, skipping:', data);
          }
        });

        //region relay 
        this.signalRService.regionRelay$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            // console.log('%c🛰️ RegionRelay update received:', 'color: green;', JSON.stringify(data, null, 2));
            this.regionRelays = [...data];
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Invalid or empty regionRelay data, skipping:', data);
          }
        });

        this.signalRService.emrTemperature$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            // console.log('%c🛰️ Emr temperature update received:', 'color: green;', JSON.stringify(data, null, 2));
            this.emrtemperature = [...data];
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Invalid or empty emr temperature data, skipping:', data);
          }
        });


        // 🌦️ Weather info
        this.signalRService.weather$.subscribe((data: any) => {
          this.isWeatherLoading = false;
          if (!data) {
            this.weatherList = [];
            return;
          }
          // Make sure data is always an array
          const dataArray = Array.isArray(data) ? data : [data];
          this.weatherList = dataArray.map(item => ({
            temperature: item.Temperature ?? item.temperature ?? 0,
            wind: item.Wind ?? item.wind ?? 0,
            snow: item.Snow ?? item.snow ?? 'No Snow',
            rain: item.Rain ?? item.rain ?? 'No Rain',
            timestamp: new Date().toISOString() // always provide string
          }));

          this.cdr.detectChanges();
        });


        // 🌦️ Bus arrival info
        this.signalRService.busArrival$.subscribe((data: BusArrival[] | null) => {
          if (!data || data.length === 0) {
            this.buses = [];
            this.cdr.detectChanges();
            return;
          }

          const dataArray = Array.isArray(data) ? data : [data];

          // Map to your internal model
          this.buses = dataArray.map(item => ({
            shortName: item.shortName ?? '',
            headsign: item.headsign ?? '',
            realtimeArrivalMinutes: item.realtimeArrivalMinutes ?? 0
          }));

          // update Angular UI
          this.cdr.detectChanges();
        });


        // ⚡ Electricity info
        this.signalRService.electricity$.subscribe((data: ElectricityInfo[] | null) => {

          if (!data || data.length === 0) {
            this.electricity = [];
            this.cdr.detectChanges();
            return;
          }

          const dataArray = Array.isArray(data) ? data : [data];

          this.electricity = dataArray.map(item => ({
            isGeneratorOn: item.isGeneratorOn ?? false,
            isMainElectricityOn: item.isMainElectricityOn ?? false
          }));

          this.cdr.detectChanges();

        });

        // 🎹 Harmonic Info
        this.signalRService.harmonicInfo$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {
            // console.log('%c🎹 Harmonic update received:', 'color: orange;', JSON.stringify(data, null, 2));
            this.harmonicSystems = [...data];
            this.cdr.detectChanges();
          } else {
            console.warn('⚠️ Invalid or empty harmonicinfo data, skipping:', data);
            this.harmonicSystems = [];
            this.cdr.detectChanges();
          }
        });

        // 👷 Engineers On Shift
        this.signalRService.EngineerOnShiftInfo$.subscribe(data => {
          if (data && Array.isArray(data) && data.length > 0) {

            this.engineersOnShift = [...data];
            this.cdr.detectChanges();

          } else {
            console.warn('⚠️ Invalid or empty enginnersonshift data, skipping:', data);

            this.engineersOnShift = [];
            this.cdr.detectChanges();
          }
        });





      });
    } catch (error) {
      console.error('❌ SignalR initialization error:', error);
    }
  }

  // -------------------- Disco animation mapping --------------------
  private setAnimation(message: string): void {
    this.currentAnimation = this.discoAnimations[message] ?? '/animations/default.gif';
  }

  //updating channels how have error
  updateChannelsWithError(updatedChannels: TVChannel[]): void {
    if (updatedChannels.length > 0) {
      this.channels = [...updatedChannels];
    } else {
      console.warn('⚠️ chanellInfoUpdate is empty, preserving current channels');
    }
  }

  //temperature logic
  get isHot(): boolean {
    const temp = parseFloat(this.temperatureInfo?.temperature || '0');
    // console.log('🌡️ Checking isHot, temp:', temp);
    return temp > 24;
  }


  //winter flake
  startNewYearAnimation() {
    if (!this.themeService.isChristmasSeason()) {
      this.stopNewYearAnimation();
      return;
    }

    this.newYearActive = true;
    this.generateSnowflakes();

    if (!this.snowAnimating) {
      this.snowAnimating = true;
      this.animateSnowflakes();
    }
  }

  stopNewYearAnimation() {
    this.newYearActive = false;
    this.snowAnimating = false;
    this.snowflakes = [];
  }

  generateSnowflakes() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const count = Math.min(100, Math.floor((screenWidth * screenHeight) / 10000));

    this.snowflakes = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * screenWidth,
      y: Math.random() * screenHeight,
      size: 2 + Math.random() * 5,
      speed: 0.5 + Math.random() * 1.5,
      drift: Math.random() * 0.5 - 0.25,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
      opacity: 0.6 + Math.random() * 0.4
    }));
  }

  animateSnowflakes() {
    if (!this.newYearActive) {
      this.snowAnimating = false;
      return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.snowflakes.forEach(flake => {
      flake.y += flake.speed;
      flake.sway += flake.swaySpeed;
      flake.x += Math.sin(flake.sway) * flake.drift;

      if (flake.y > screenHeight) {
        flake.y = -flake.size;
        flake.x = Math.random() * screenWidth;
        flake.speed = 0.5 + Math.random() * 1.5;
        flake.drift = Math.random() * 0.5 - 0.25;
        flake.swaySpeed = 0.01 + Math.random() * 0.02;
        flake.opacity = 0.6 + Math.random() * 0.4;
      }

      if (flake.x > screenWidth) flake.x = 0;
      if (flake.x < 0) flake.x = screenWidth;
    });

    requestAnimationFrame(() => this.animateSnowflakes());
  }

  @HostListener('window:resize')
  onResize() {
    if (this.newYearActive) {
      this.generateSnowflakes();
    }
    if (this.canvasElement) {
      this.canvasElement.width = window.innerWidth;
      this.canvasElement.height = window.innerHeight;
    }
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.applyThemes();
    }
  }



  //present firework
  private fireworksStarted = false;
  private canvasElement?: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  particles: any[] = [];

  @ViewChild('fwCanvas')
  set fwCanvas(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.canvasElement = ref?.nativeElement;
    if (this.canvasElement) {
      this.initFireworksCanvas();
    } else {
      this.fireworksStarted = false;
    }
  }

  autoClickPresent() {
    if (!this.isChristmasTheme) return;
    const present = document.querySelector('.present') as HTMLElement;
    if (!present) return;
    present.click();
  }

  private initFireworksCanvas() {
    const canvas = this.canvasElement;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (!this.fireworksStarted) {
      this.fireworksStarted = true;
      this.loop();
    }
  }

  ngAfterViewInit() {
    this.initFireworksCanvas();
  }

  // Fireworks at screen center
  boom(event?: MouseEvent) {
    if (!this.isChristmasTheme) return;
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;

    const colors = [
      "hsl(0,100%,70%)",
      "hsl(40,100%,70%)",
      "hsl(120,100%,60%)",
      "hsl(200,100%,65%)",
      "hsl(280,100%,70%)",
      "hsl(330,100%,75%)"
    ];

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 8;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: 3 + Math.random() * 3,
        trail: [],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  loop() {
    const ctx = this.ctx;
    const canvas = this.canvasElement;
    if (!ctx || !canvas || !this.isChristmasTheme) {
      this.fireworksStarted = false;
      return;
    }

    // SOFT FADE (better than full clear)
    ctx.fillStyle = "rgba(0, 0, 0, 0)"; // transparent canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles = this.particles.filter(p => p.alpha > 0.02);

    this.particles.forEach(p => {
      // Movement
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // Gravity for nicer arcs
      p.alpha -= 0.015;

      // Save trail history
      p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
      if (p.trail.length > 10) p.trail.shift(); // Max trail length

      // Draw TRAIL
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        ctx.globalAlpha = t.alpha * (i / p.trail.length);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.size * (i / p.trail.length), 0, Math.PI * 2);
        ctx.fill();
      }

      // MAIN PARTICLE GLOW
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 25;   // BIG BLOOM
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(() => this.loop());
  }





  private readonly nonOrbitalSatelliteLabels = new Set([
    'relay',
    'optic',
    'ip/optic',
    't2',
    'encoders',
    'multiswitches',
    'mukhianii',
    'mukhianiii'
  ]);

  getSatelliteValueClass(detail: SatelliteDetail): Record<string, boolean> {
    return {
      'natia-error': !!detail?.HaveError,
      'natia-warn': !detail?.HaveError && !!detail?.HaveWarn,
      'natia-success': !detail?.HaveError && !detail?.HaveWarn
    };
  }

  getSatelliteMerClass(detail: SatelliteDetail): Record<string, boolean> {
    return {
      'natia-error': !!detail?.HaveError,
      'natia-warn': !detail?.HaveError && !!detail?.HaveWarn,
      'symbolRate': !detail?.HaveError && !detail?.HaveWarn
    };
  }

  getSatelliteTitle(detail: SatelliteDetail): string {
    if (detail?.HaveError) {
      return 'Transponder has an error';
    }
    if (detail?.HaveWarn) {
      return 'Transponder warning';
    }
    return 'Operational';
  }

  hasValidMer(mer: string | null | undefined): boolean {
    return mer != null && mer !== '' && mer !== 'N/A';
  }

  showSatelliteIcon(degree: string | null | undefined): boolean {
    if (!degree) {
      return false;
    }
    const normalized = degree.toString().trim().toLowerCase().replace(/\s+/g, '');
    return !this.nonOrbitalSatelliteLabels.has(normalized);
  }

  getRelayInfoClass(info: { isHaveProblem?: boolean; isWarning?: boolean }): Record<string, boolean> {
    return {
      'natia-temp-error': !!info?.isHaveProblem,
      'natia-warn': !info?.isHaveProblem && !!info?.isWarning,
      'natia-success': !info?.isHaveProblem && !info?.isWarning
    };
  }

  getEmrTempClass(emrTemp: EmrTemperature): Record<string, boolean> {
    return {
      'natia-temp-error': !!emrTemp?.IsError,
      'natia-warn': !emrTemp?.IsError && !!emrTemp?.IsWarm,
      'natia-success': !emrTemp?.IsError && !emrTemp?.IsWarm
    };
  }

  getEmrTempLabel(emrTemp: EmrTemperature): string {
    if (emrTemp?.IsError) {
      return 'Hot';
    }
    if (emrTemp?.IsWarm) {
      return 'Warm';
    }
    return 'Normal';
  }

  // trackBy function for ngFor
  trackByFlakeId(index: number, flake: Snowflake) {
    return flake.id;
  }

  // Angular's trackBy function to optimize ngFor performance.
  trackByOrder(index: number, channel: TVChannel): number {
    return channel.Order;
  }

  trackByDegree(index: number, satellite: Satellite): string {
    return satellite.Degree;
  }

  trackBySatelliteDetail(index: number, detail: SatelliteDetail): string {
    return `${detail.Frequency}|${detail.Polarisation}|${detail.SymbolRate}|${detail.PortIn250}`;
  }

  trackByRegion(index: number, region: RegionRelay): string {
    return region.regionName;
  }

  trackByRelayInfo(index: number, info: any): string {
    return info.FrequecyOrder;
  }

  trackByEmrTemperature(index: number, emrTemp: EmrTemperature): string {
    return emrTemp.Name;
  }

  trackBySnowflake(index: number, flake: any): number {
    return flake.id;
  }

  // trackBy function to prevent string | undefined error
  trackByWeatherTimestamp(index: number, weather: WeatherUpdate): string {
    return weather.timestamp ?? index.toString();
  }

  trackByHarmonicName(index: number, system: HarmonicSystem): string {
    return system.harmonicName;
  }

  trackByEngineer(index: number, eng: EngineerOnShift): string {
    return eng.name ?? index.toString();
  }


}














