import { describe, expect, it, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuAlternativesComponent } from './menu-alternatives.component';

describe('MenuAlternativesComponent', () => {
  let component: MenuAlternativesComponent;
  let fixture: ComponentFixture<MenuAlternativesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuAlternativesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuAlternativesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have PLATE_ALTERNATIVES rules', () => {
    expect(component.rules.length).toBe(3);
  });

  it('should have intro text', () => {
    expect(component.intro).toContain('sostituzione');
  });

  it('emits whether the guide was opened or closed', () => {
    const states: boolean[] = [];
    component.guideToggled.subscribe(open => states.push(open));
    const details = document.createElement('details');
    details.open = true;
    component.onToggle({ currentTarget: details } as unknown as Event);
    details.open = false;
    component.onToggle({ currentTarget: details } as unknown as Event);

    expect(states).toEqual([true, false]);
  });
});
