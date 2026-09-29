import { Component } from '@angular/core';

export interface AlternativeItem {
  label: string;
  detail?: string;
}

export interface PlateAlternative {
  course: string;
  pick: number;
  note?: string;
  items: readonly AlternativeItem[];
}

export const PLATE_ALTERNATIVES: readonly PlateAlternative[] = [
  {
    course: 'Primo piatto',
    pick: 1,
    items: [
      { label: 'Formaggio al taglio', detail: '70 g · Brie, Emmenthal, Scamorza, Edamer' },
      { label: 'Salume', detail: '80 g · Prosciutto cotto, Prosciutto crudo, Speck, Bresaola' },
      { label: 'Contorno caldo o freddo' },
      { label: '1 yogurt' },
      { label: '1 frutto' },
      { label: '1 dessert' }
    ]
  },
  {
    course: 'Secondo piatto',
    pick: 1,
    items: [
      {
        label: 'Formaggio',
        detail: '100 g · Brie, Emmenthal, Scamorza, Edamer, formaggi confezionati'
      },
      {
        label: 'Salume',
        detail: '100 g · Prosciutto cotto (90 g), prosciutto crudo, Bresaola, Speck'
      },
      { label: 'Piatto freddo gastronomico' },
      { label: "Tonno all'olio d'oliva" },
      { label: 'Carne in scatola' },
      { label: '2 yogurt' }
    ]
  },
  {
    course: 'Contorno',
    pick: 0,
    note: 'Non sono previste alternative',
    items: []
  }
];

@Component({
  selector: 'menu-alternatives',
  templateUrl: './menu-alternatives.component.html',
  styleUrl: './menu-alternatives.component.css'
})
export class MenuAlternativesComponent {
  readonly rules = PLATE_ALTERNATIVES;
  readonly intro =
    'In sostituzione del piatto in menù: scegli una sola voce per ciascuna portata.';
  readonly note =
    '* I salumi e i formaggi affettati verranno erogati su richiesta, ' +
    'in base alle tipologie rese disponibili dallo chef nella giornata.';
}
