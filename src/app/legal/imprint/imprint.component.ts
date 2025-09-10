import { Component, inject, AfterViewInit } from '@angular/core';
import { SharedFunctionsService } from '../../core/services/shared-functions.service';

@Component({
  selector: 'app-imprint',
  imports: [],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent implements AfterViewInit {
  private sharedSharedFunctionsService = inject(SharedFunctionsService);

  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo(0, 0), 0.25);
  }

  goBack(): void {
    this.sharedSharedFunctionsService.goBack();
  }
}
