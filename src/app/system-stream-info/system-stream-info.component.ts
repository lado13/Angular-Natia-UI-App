import { Component } from '@angular/core';
import { SystemStreamInfoService } from '../../service/system-stream-info.service';
import { Program } from '../../model/program';
import { Stream } from '../../model/stream';
import { CommonModule } from '@angular/common';
import { SystemStreamInfo } from '../../model/systemStreamInfo';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-system-stream-info',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './system-stream-info.component.html',
  styleUrl: './system-stream-info.component.scss'
})
export class SystemStreamInfoComponent {
  systemStreams: SystemStreamInfo[] = [];
  pagedStreams: SystemStreamInfo[] = [];

  loading = true;
  error = '';

  page = 1;
  pageSize = 3; // number of streams per page

  constructor(private service: SystemStreamInfoService) { }

  ngOnInit(): void {
    this.service.getSystemStreamInfo().subscribe({
      next: (data) => {
        console.log(data);

        this.systemStreams = data;
        this.updatePage();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load stream info';
        this.loading = false;
      }
    });


  }

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