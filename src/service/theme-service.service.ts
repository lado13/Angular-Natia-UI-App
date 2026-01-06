import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {

  private renderer: Renderer2;
  private isDay: boolean = true;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  checkTimeAndSetTheme(): void {
    const hour = new Date().getHours();
    this.isDay = hour >= 11 && hour < 17; // day between 11AM - 5PM

    if (this.isDay) {
      this.setDayTheme();
    } else {
      this.setNightTheme();
    }
  }

  private setDayTheme(): void {
    this.renderer.removeClass(document.body, 'night-theme');
    this.renderer.addClass(document.body, 'day-theme');
  }

  private setNightTheme(): void {
    this.renderer.removeClass(document.body, 'day-theme');
    this.renderer.addClass(document.body, 'night-theme');
  }

}
