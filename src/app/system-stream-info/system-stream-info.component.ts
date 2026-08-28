import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { SystemStreamInfoService } from '../../service/system-stream-info.service';
import { Program } from '../../model/program';
import { Stream } from '../../model/stream';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SystemStreamInfo } from '../../model/systemStreamInfo';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-system-stream-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './system-stream-info.component.html',
  styleUrl: './system-stream-info.component.scss'
})
export class SystemStreamInfoComponent implements OnInit, OnDestroy {
  systemStreams: SystemStreamInfo[] = [];
  pagedStreams: SystemStreamInfo[] = [];

  loading = true;
  error = '';

  page = 1;
  pageSize = 1;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private service: SystemStreamInfoService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    this.loadStreams();
    this.refreshTimer = setInterval(() => this.loadStreams(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private loadStreams(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = '';
    }

    this.service.getSystemStreamInfo().subscribe({
      next: (data) => {
        this.systemStreams = Array.isArray(data) ? data : [];
        if (this.page > this.totalPages) {
          this.page = 1;
        }
        this.updatePage();
        this.loading = false;
        this.error = '';
      },
      error: (err) => {
        console.error('Failed to load system stream info', err);
        this.error = 'Failed to load stream info';
        this.loading = false;
      }
    });
  }


  // // ---------------- Voice Command ----------------
  // initVoice() {
  //   const SpeechRecognition = (window as any).SpeechRecognition || webkitSpeechRecognition;
  //   this.recognition = new SpeechRecognition();
  //   this.recognition.lang = "ka-GE"; // Georgian
  //   this.recognition.continuous = true;
  //   this.recognition.interimResults = false;

  //   this.recognition.onresult = (event: any) => {
  //     const text = event.results[event.results.length - 1][0].transcript.trim();
  //     this.lastCommand = text;
  //     this.handleCommand(text);
  //   };

  //   this.recognition.onend = () => {
  //     if (this.isListening) this.recognition.start(); // Auto resume
  //   };
  // }

  // startVoice() {
  //   if (this.isListening) return;
  //   this.initVoice();
  //   this.recognition.start();
  //   this.isListening = true;
  //   this.status = "Listening...";
  // }

  // stopVoice() {
  //   if (!this.isListening) return;
  //   this.recognition.stop();
  //   this.isListening = false;
  //   this.status = "Stopped";
  // }

  // // Handle voice commands
  // handleCommand(text: string) {
  //   text = text.toLowerCase();

  //   if (text.includes("შემდეგი") || text.includes("შემდეგი გვერდი") || text.includes("წინ")) {
  //     this.nextPage();
  //   }

  //   if (text.includes("უკან") || text.includes("წინა გვერდი")) {
  //     this.prevPage();
  //   }

  //   if (text.includes("მთავარი გვერდი") || text.includes("ნათიას გვერდი") || text.includes("მთავარი")) {
  //     this.goHome();
  //   }


  //   // if (cmd.includes("სტოპ")) {
  //   //   this.stopVoice();
  //   // }

  //   // if (cmd.includes('ჩაირთე')) {
  //   //   this.startVoice();

  //   // }
  // }

  // goHome() {
  //   this.stopVoice();
  //   this.router.navigate(['/']); // Angular Router navigation
  // }


  updatePage(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    this.pagedStreams = this.systemStreams.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
    } else {
      this.page = 1; // loop back to first page
    }
    this.updatePage();
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
    } else {
      this.page = this.totalPages; // loop back to last page
    }
    this.updatePage();
  }


  goToPage(p: number): void {
    this.page = p;
    this.updatePage();
  }

  get totalPages(): number {
    return Math.ceil(this.systemStreams.length / this.pageSize);
  }

  trackByStreamInfoIpPort(index: number, s: SystemStreamInfo): string {
    return `${s?.ip}:${s?.port}`;
  }

  trackByProgramId(index: number, program: Program): number {
    return program?.programId ?? index;
  }

  trackByStreamPid(index: number, stream: Stream): number {
    return stream?.pid ?? index;
  }
}