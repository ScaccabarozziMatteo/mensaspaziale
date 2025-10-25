export interface DailyMenu {
    id: number,
    week: number,
    day: number,
    primi_piatti: String[],
    secondi_piatti: String[],
    piatto_dello_chef: String,
    contorni: String[],
    alternative_variabili: String[]
}