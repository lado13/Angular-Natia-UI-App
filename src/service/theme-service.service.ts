import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeServiceService {

  private renderer: Renderer2;
  private isDay = true;
  christmasActive = false;

  /** 8 November through 30 January */
  private readonly christmasStartMonth = 10;
  private readonly christmasStartDay = 8;
  private readonly christmasEndMonth = 0;
  private readonly christmasEndDay = 30;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  checkTimeAndSetTheme(date: Date = new Date()): void {
    const hour = date.getHours();
    this.isDay = hour >= 11 && hour < 17;

    if (this.isDay) {
      this.setDayTheme();
    } else {
      this.setNightTheme();
    }

    this.setChristmasTheme(this.isChristmasSeason(date));
  }

  isChristmasSeason(date: Date = new Date()): boolean {
    // TEST: force Christmas ON — remove this line after testing
    // return true;

    const month = date.getMonth(); // Jan=0 ... Aug=7 ... Nov=10 ... Dec=11
    const day = date.getDate();

    const inNovember = month === this.christmasStartMonth && day >= this.christmasStartDay;
    const inDecember = month === 11;
    const inJanuary = month === this.christmasEndMonth && day <= this.christmasEndDay;

    return inNovember || inDecember || inJanuary;
  }

  private setDayTheme(): void {
    this.renderer.removeClass(document.body, 'night-theme');
    this.renderer.addClass(document.body, 'day-theme');
  }

  private setNightTheme(): void {
    this.renderer.removeClass(document.body, 'day-theme');
    this.renderer.addClass(document.body, 'night-theme');
  }

  private setChristmasTheme(active: boolean): void {
    this.christmasActive = active;

    if (active) {
      this.renderer.addClass(document.body, 'christmas-theme');
    } else {
      this.renderer.removeClass(document.body, 'christmas-theme');
    }
  }

}
