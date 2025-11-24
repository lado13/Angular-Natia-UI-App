import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ChannelApiResponse } from '../model/channel-api-response';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChannelServiceService {

  private apiUrl = environment.apiUrl;
  private channelDetailsApi = environment.channelDetailsApi;

  constructor(private http: HttpClient) { }

  // Get Channel + Satellite data
  getData(): Observable<ChannelApiResponse> {
    return this.http.get<ChannelApiResponse>(this.apiUrl + 'GetDataForUI');
  }

  async getDataAsync(): Promise<ChannelApiResponse> {
    try {
      return await firstValueFrom(
        this.http.get<ChannelApiResponse>(this.apiUrl + 'GetDataForUI')
      );
    } catch (error) {
      console.error('GetDataForUI:', error);
      throw error;
    }
  }

  // 👇 New function: Get Channel Details (HTML)
  getChannelDetails(name: string): Observable<string> {
    const encodedName = encodeURIComponent(name); // encode channel name
    return this.http.get(
      `${this.channelDetailsApi}${encodedName}`,  // safe URL
      { responseType: 'text' }   // Return raw HTML
    );
  }

}
