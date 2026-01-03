import { Component, Input } from "@angular/core";

@Component({
  selector: 'menu-section',
  templateUrl: './menu-section.component.html',
  styleUrls: ['../menu.component.css']
})
export class MenuSectionComponent {
  @Input({ required: true }) dishes: string[] | string | undefined = [];
  @Input({ required: true }) title: string = '';
  @Input({ required: true }) icon: string = '';

}