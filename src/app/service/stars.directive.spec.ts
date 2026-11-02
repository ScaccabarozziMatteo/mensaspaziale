import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StarsDirective } from './stars.directive';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: '[hostComponent]',
  template: '<div appStars [starCount]="starCount"></div>',
  imports: [StarsDirective]
})
class HostComponent {
  @Input() starCount = 10;
}

describe('StarsDirective', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let componentInstance: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }]
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
    expect(hostFixture.debugElement.children[0].nativeElement.children.length).toBe(10);
  });

  it('should have starCount input set', () => {
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    expect(directive.starCount).toBe(10);
  });

  it('should change star count', () => {
    hostFixture.componentRef.setInput('starCount', 20);
    hostFixture.detectChanges();
    
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    expect(directive.starCount).toBe(20);
    expect(hostFixture.debugElement.children[0].nativeElement.children.length).toBe(20);
  });

  it('removes created stars when the directive is destroyed', () => {
    const host = hostFixture.debugElement.children[0].nativeElement;
    const directive = hostFixture.debugElement.children[0].injector.get(StarsDirective);
    directive.ngOnDestroy();
    expect(host.children.length).toBe(0);
  });
});
