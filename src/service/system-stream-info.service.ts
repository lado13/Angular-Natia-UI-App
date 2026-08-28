import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { SystemStreamInfo } from '../model/systemStreamInfo';
import { Program } from '../model/program';
import { Stream } from '../model/stream';

@Injectable({
  providedIn: 'root'
})
export class SystemStreamInfoService {
  private apiUrl = environment.systemStreamInfoApi;

  constructor(private http: HttpClient) { }

  getSystemStreamInfo(): Observable<SystemStreamInfo[]> {
    return this.http.get<unknown>(this.apiUrl).pipe(
      map(payload => this.normalize(payload)),
      catchError(err => {
        if (err?.status === 404) {
          return of([]);
        }
        console.error('SystemStreamInfo request failed', err);
        return throwError(() => err);
      })
    );
  }

  private normalize(payload: unknown): SystemStreamInfo[] {
    const rows = this.extractList(payload);
    return rows.map(item => this.mapStreamInfo(item));
  }

  private extractList(payload: unknown): any[] {
    if (payload == null) {
      return [];
    }
    if (Array.isArray(payload)) {
      return payload;
    }
    if (typeof payload !== 'object') {
      return [];
    }

    const data = payload as Record<string, unknown>;
    const preferredKeys = ['systemStreamInfo', 'streams', 'items', 'data', 'result'];
    for (const key of preferredKeys) {
      const foundKey = Object.keys(data).find(k => k.toLowerCase() === key.toLowerCase());
      if (foundKey && Array.isArray(data[foundKey])) {
        return data[foundKey] as any[];
      }
    }

    const firstArray = Object.values(data).find(value => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }

  private mapStreamInfo(item: any): SystemStreamInfo {
    const programs = item?.programs ?? item?.Programs ?? [];
    return {
      ip: item?.ip ?? item?.Ip ?? '',
      port: item?.port ?? item?.Port ?? 0,
      durationSeconds: item?.durationSeconds ?? item?.DurationSeconds ?? 0,
      startedAtUtc: item?.startedAtUtc ?? item?.StartedAtUtc ?? '',
      endedAtUtc: item?.endedAtUtc ?? item?.EndedAtUtc ?? '',
      totalPackets: item?.totalPackets ?? item?.TotalPackets ?? 0,
      bitrateKbps: item?.bitrateKbps ?? item?.BitrateKbps ?? 0,
      bitrateMbps: item?.bitrateMbps ?? item?.BitrateMbps ?? 0,
      programs: Array.isArray(programs) ? programs.map((p: any) => this.mapProgram(p)) : []
    };
  }

  private mapProgram(item: any): Program {
    const streams = item?.streams ?? item?.Streams ?? [];
    const glitch = item?.streamGlitchStatus ?? item?.StreamGlitchStatus;
    return {
      programId: item?.programId ?? item?.ProgramId ?? 0,
      pmtPid: item?.pmtPid ?? item?.PmtPid ?? 0,
      streams: Array.isArray(streams) ? streams.map((s: any) => this.mapStream(s)) : [],
      isProblematic: item?.isProblematic ?? item?.IsProblematic ?? false,
      streamGlitchStatus: glitch
        ? {
            programId: glitch.programId ?? glitch.ProgramId ?? 0,
            errors: glitch.errors ?? glitch.Errors ?? [],
            warnings: glitch.warnings ?? glitch.Warnings ?? [],
            isGlitchy: glitch.isGlitchy ?? glitch.IsGlitchy ?? false
          }
        : undefined
    };
  }

  private mapStream(item: any): Stream {
    return {
      pid: item?.pid ?? item?.Pid ?? 0,
      type: item?.type ?? item?.Type ?? '',
      codec: item?.codec ?? item?.Codec ?? null,
      packetCount: item?.packetCount ?? item?.PacketCount ?? 0,
      isVideo: item?.isVideo ?? item?.IsVideo ?? false,
      isAudio: item?.isAudio ?? item?.IsAudio ?? false,
      language: item?.language ?? item?.Language ?? null
    };
  }
}
