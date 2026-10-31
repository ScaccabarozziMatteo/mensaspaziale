import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuAlternativesComponent } from './menu-alternatives.component';

describe('MenuAlternativesComponent', () => {
  let component: MenuAlternativesComponent;
  let fixture: ComponentFixture<MenuAlternativesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenuAlternativesComponent]
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
});
