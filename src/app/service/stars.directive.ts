import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  SimpleChanges
} from '@angular/core';

@Directive({
  selector: '[appStars]'
})
export class StarsDirective implements OnChanges, OnDestroy {
  @Input() starCount: number = 80;

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  private starElements: HTMLElement[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['starCount']) {
      // clearStars() is a no-op on first render, so this covers both the
      // initial creation and any later change to starCount.
      this.clearStars();
      this.createStars();
    }
  }

  ngOnDestroy(): void {
    this.clearStars();
  }

  private createStars() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const host = this.elementRef.nativeElement;

    for (let i = 0; i < this.starCount; i++) {
      const star = this.renderer.createElement('div');
      this.renderer.addClass(star, 'star');

      const size = Math.random() * 3 + 1;
      this.renderer.setStyle(star, 'width', size + 'px');
      this.renderer.setStyle(star, 'height', size + 'px');
      this.renderer.setStyle(star, 'left', Math.random() * 100 + '%');
      this.renderer.setStyle(star, 'top', Math.random() * 100 + '%');
      this.renderer.setStyle(star, 'animationDelay', Math.random() * 3 + 's');
      this.renderer.setStyle(star, 'animationDuration', (Math.random() * 3 + 2) + 's');

      this.renderer.appendChild(host, star);
      this.starElements.push(star);
    }
  }

  private clearStars() {
    for (const star of this.starElements) {
      this.renderer.removeChild(this.elementRef.nativeElement, star);
    }
    this.starElements = [];
  }
}
