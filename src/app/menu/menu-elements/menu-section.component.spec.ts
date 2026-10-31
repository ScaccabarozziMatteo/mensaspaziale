import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuSectionComponent } from './menu-section.component';

describe('MenuSectionComponent', () => {
  let component: MenuSectionComponent;
  let fixture: ComponentFixture<MenuSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuSectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept dishes input', () => {
    const dishes = ['Pasta al pomodoro', 'Risotto ai funghi'];
    component.dishes = dishes;
    expect(component.dishes).toEqual(dishes);
  });

  it('should accept title input', () => {
    const title = 'Primi Piatti';
    component.title = title;
    expect(component.title).toBe(title);
  });

  it('should accept icon input', () => {
    const icon = '🍝';
    component.icon = icon;
    expect(component.icon).toBe(icon);
  });

  it('should accept meat_label input', () => {
    const labels = [true, false, true];
    component.meat_label = labels;
    expect(component.meat_label).toEqual(labels);
  });

  it('should accept fish_label input', () => {
    const labels = [false, true, false];
    component.fish_label = labels;
    expect(component.fish_label).toEqual(labels);
  });

  it('should accept vegan_label input', () => {
    const labels = [true, false, false];
    component.vegan_label = labels;
    expect(component.vegan_label).toEqual(labels);
  });

  it('renders the supplied dishes and explicit dietary labels', () => {
    component.dishes = ['Vegetale', 'Carne'];
    component.title = 'Secondi';
    component.meat_label = [false, true];
    component.fish_label = [false, false];
    component.vegan_label = [false, false];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vegetale');
    expect(fixture.nativeElement.textContent).toContain('Carne');
    expect(fixture.nativeElement.textContent).toContain('🥕');
    expect(fixture.nativeElement.textContent).toContain('🍖');
  });

  it('does not infer vegetarian labels when Appwrite omitted the label arrays', () => {
    component.dishes = ['Pasto senza classificazione'];
    component.meat_label = [];
    component.fish_label = [];
    component.vegan_label = [];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('🥕');
  });
});
