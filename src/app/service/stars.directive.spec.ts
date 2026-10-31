import { Component, ElementRef, Input, OnDestroy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarsDirective } from './stars.directive';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: '[hostComponent]',
  template: '<div [appStars]="starCount"></div>',
  standalone: false
})
class HostComponent {
  @Input() starCount = 10;
}

describe('StarsDirective', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let componentInstance: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StarsDirective, HostComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        ElementRef
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    componentInstance = hostFixture.componentInstance;
  });

  afterEach(() => {
    hostFixture.destroy();
  });

  it('should create directive and render stars', () => {
    expect(componentInstance).toBeTruthy();
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    expect(directive).toBeTruthy();
  });

  it('should have starCount input set', () => {
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    expect(directive.starCount).toBe(10);
  });

  it('should change star count', () => {
    componentInstance.starCount = 20;
    hostFixture.detectChanges();
    
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    expect(directive.starCount).toBe(20);
  });
});