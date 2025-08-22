import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-btns',
  imports: [RouterLink],
  templateUrl: './legal-btns.component.html',
  styleUrl: './legal-btns.component.scss',
})
export class LegalBtnsComponent {
  router = inject(Router);
}
