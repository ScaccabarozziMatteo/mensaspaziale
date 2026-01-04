export class DailyMenu {
  constructor(
    public id: string,
    public week: number,
    public day: number,
    public primi_piatti: string[],
    public secondi_piatti: string[],
    public piatto_dello_chef: string,
    public contorni: string[],
    public alternative_variabili: string[],
    public date: string,
    public meat_label: boolean[],
    public fish_label: boolean[],
    public vegetarian_label: boolean[]
  ) {}
}