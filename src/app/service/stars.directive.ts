import { Directive, ElementRef, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appStars]'
})
export class StarsDirective implements OnInit {
  @Input() starCount: number = 80;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.createStars();
  }

  private createStars() {
    for (let i = 0; i < this.starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      const size = Math.random() * 3 + 1;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      this.el.nativeElement.appendChild(star);
    }
  }
}