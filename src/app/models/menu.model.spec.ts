import { describe, expect, it } from 'vitest';
import { DailyMenu } from './menu.model';

describe('DailyMenu Model', () => {
  it('should create an instance', () => {
    const menu = new DailyMenu(
      'menu-id-1',
      1,
      0,
      ['Pasta al pomodoro', 'Risotto'],
      ['Pollo alla griglia', 'Manzo'],
      'Insalata',
      ['Patate al forno', 'Insalata verde'],
      ['Formaggio', 'Salume'],
      '25/10/2025',
      [true, false, true, false],
      [false, true, false, true],
      [true, true, false, false]
    );

    expect(menu).toBeTruthy();
    expect(menu.id).toBe('menu-id-1');
    expect(menu.week).toBe(1);
    expect(menu.day).toBe(0);
    expect(menu.primi_piatti).toEqual(['Pasta al pomodoro', 'Risotto']);
    expect(menu.secondi_piatti).toEqual(['Pollo alla griglia', 'Manzo']);
    expect(menu.piatto_dello_chef).toBe('Insalata');
    expect(menu.contorni).toEqual(['Patate al forno', 'Insalata verde']);
    expect(menu.alternative_variabili).toEqual(['Formaggio', 'Salume']);
    expect(menu.date).toBe('25/10/2025');
    expect(menu.meat_label).toEqual([true, false, true, false]);
    expect(menu.fish_label).toEqual([false, true, false, true]);
    expect(menu.vegan_label).toEqual([true, true, false, false]);
  });

  it('should handle empty menus', () => {
    const menu = new DailyMenu(
      'menu-id-2',
      2,
      1,
      [],
      [],
      'Special dish',
      [],
      [],
      '26/10/2025',
      [],
      [],
      []
    );

    expect(menu.primi_piatti).toEqual([]);
    expect(menu.secondi_piatti).toEqual([]);
    expect(menu.contorni).toEqual([]);
  });

  it('should handle labels arrays of different lengths', () => {
    const menu = new DailyMenu(
      'menu-id-3',
      3,
      2,
      ['Dish1'],
      ['Dish2'],
      'Dish3',
      ['Dish4'],
      [],
      '27/10/2025',
      [true],
      [false],
      [true, false]
    );

    expect(menu.meat_label).toEqual([true]);
    expect(menu.fish_label).toEqual([false]);
    expect(menu.vegan_label).toEqual([true, false]);
  });
});