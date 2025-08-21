import { Component, inject } from '@angular/core';
import { SharedFunctionsService } from '../../core/services/shared-functions.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  private sharedSharedFunctionsService = inject(SharedFunctionsService);

  goBack(): void {
    this.sharedSharedFunctionsService.goBack();
  }
}
