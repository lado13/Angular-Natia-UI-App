
import { Component, OnInit, ChangeDetectorRef, NgZone, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChannelServiceService } from '../../../service/channel-service.service';
import { SignalRService } from '../../../service/signal-rservice.service';
import { Satellite } from '../../../model/satellite';
import { TemperatureInfo } from '../../../model/temperature-info';
import { TVChannel } from '../../../model/tvchannel';
import { firstValueFrom, Observable } from 'rxjs';
import { ThemeServiceService } from '../../../service/theme-service.service';
import { OpticChannelProblem } from '../../../model/optic-channel-problem';
import { CardInfoToActivate } from '../../../model/card-info-to-activate';
import { RegionRelay } from '../../../model/region-relay';
import { DiscoMessage } from '../../../model/disco-message';
import { EmrTemperature } from '../../../model/emr-temperature';
import { RouterModule } from '@angular/router';
import { Snowflake } from '../../../model/snowflake';



@Component({
  selector: 'app-natia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './natia.component.html',
  styleUrls: ['./natia.component.scss']
})
export class NatiaComponent implements OnInit {
  channels: TVChannel[] = [];
  satellites: Satellite[] = [];
  temperatureInfo!: TemperatureInfo;
  opticChannels$!: Observable<OpticChannelProblem[]>;
  cards$!: Observable<CardInfoToActivate[]>;
  regionRelays: RegionRelay[] = [];
  robotSpeech: string | null = null;
  currentMessage: DiscoMessage | null = null;
  currentAnimation: string | null = null;
  emrtemperature: EmrTemperature[] = [];
  animations: ('duck' | 'bat' | 'squad')[] = ['duck', 'bat', 'squad'];
  currentAnimations: 'duck' | 'bat' | 'squad' | null = null;
  private index = 0;
  currentTime: Date = new Date();
  private timer: any;
  newYearActive = false;
  snowflakes: Snowflake[] = [];




  //channels detail info
  hoverHtml: string | null = null;
  isLoading = false;
  hoverX = 0;
  hoverY = 0;




  constructor(
    private channelService: ChannelServiceService,
    private signalRService: SignalRService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private themeService: ThemeServiceService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadDataWithRetry();
    await this.initSignalR();

    //channels with problem
    this.opticChannels$ = this.signalRService.opticChannelProblem$;

    //card activate
    this.cards$ = this.signalRService.cardInfo$;

    //funny animation
    this.startAnimationCycle();

    // // 🎄 Start snow effect automatically
    this.startNewYearAnimation();

    // check theme immediately
    this.themeService.checkTimeAndSetTheme();

    // re-check every 5 minutes (in case user keeps page open)
    setInterval(() => {
      this.themeService.checkTimeAndSetTheme();
    }, 5 * 60 * 1000);

    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }



  //fanny animation
  startAnimationCycle() {
    const animation = this.animations[this.index];
    const now = new Date();
    console.log(`🟢 Animation START: ${animation} at ${now.toLocaleTimeString()}`);

    // Show the current animation
    this.currentAnimations = animation;

    // Animation duration: 40 seconds
    setTimeout(() => {
      // Hide the animation after it finishes
      this.currentAnimations = null;
      this.cdr.detectChanges(); // Trigger Angular change detection
      const end = new Date();
      console.log(`🔴 Animation END: ${animation} at ${end.toLocaleTimeString()}`);

      // Wait 1 hour before showing the next animation
      setTimeout(() => {
        this.index = (this.index + 1) % this.animations.length;
        this.startAnimationCycle(); // Recursively show the next animation
      }, 3600000); // 1 hour = 3600000ms
    }, 40000); // 40 seconds = animation duration
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
          console.log(`⏳ Retrying in ${delay}ms...`);
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
    this.hoverX = event.clientX;
    this.hoverY = event.clientY;
    this.isLoading = true;
    this.hoverHtml = `<div class="hover-loading">Loading details for ${name}...</div>`;

    this.channelService.getChannelDetails(name).subscribe({
      next: (html) => {
        if (html && html.trim() !== '') {
          // If response has content
          this.hoverHtml = html;
          console.log(`✅ Channel details loaded for ${name}:`, html);
        } else {
          // If response is empty or null
          this.hoverHtml = `<b style='color:orange'>No details available for ${name}</b>`;
          console.warn(`⚠️ No details returned for ${name}`);
        }
        this.isLoading = false;
      },
      error: (err) => {
        // Log full error object
        console.error(`❌ Error loading channel details for ${name}:`, err);
        this.hoverHtml = `<b style='color:red'>Error loading details for ${name}</b>`;
        this.isLoading = false;
      }
    });
  }


  onMouseLeave() {
    this.hoverHtml = null;
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
              console.log('🕛 Disco cleared after 10 seconds');
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

      });
    } catch (error) {
      console.error('❌ SignalR initialization error:', error);
    }
  }

  // -------------------- Disco animation mapping --------------------
  private setAnimation(message: string): void {
    switch (message) {
      case 'Morning': this.currentAnimation = 'assets/gif/christmas-dancing.gif'; break;
      case 'Evening': this.currentAnimation = 'assets/gif/evening.gif'; break;
      case 'Night': this.currentAnimation = 'assets/gif/night.gif'; break;
      case 'Afternoon': this.currentAnimation = 'assets/gif/afternoon.gif'; break;
      case 'birthday': this.currentAnimation = 'assets/gif/birthday.gif'; break;
      case 'NatiasCpuOverload': this.currentAnimation = 'assets/gif/grinch-clap.gif'; break;
      case 'NatiasRamOverload': this.currentAnimation = 'assets/gif/cpu.gif'; break;
      case 'TemperatureProblem': this.currentAnimation = 'assets/gif/temperature.gif'; break;
      default: this.currentAnimation = '/animations/default.gif'; break;
    }
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


  startNewYearAnimation() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    // Active from Nov 18 to Jan 30
    const isHoliday =
      (month === 10 && day >= 18) ||
      (month === 11) ||
      (month === 0 && day <= 30);

    if (!isHoliday) return;

    this.newYearActive = true;
    this.generateSnowflakes();
    this.animateSnowflakes();
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
    if (!this.newYearActive) return;

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
    this.generateSnowflakes();
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




}














