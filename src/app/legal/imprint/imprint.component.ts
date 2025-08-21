import { Component, inject } from '@angular/core';
import { SharedFunctionsService } from '../../core/services/shared-functions.service';

@Component({
  selector: 'app-imprint',
  imports: [],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent {
  private sharedSharedFunctionsService = inject(SharedFunctionsService);

  goBack(): void {
    this.sharedSharedFunctionsService.goBack();
  }
}
