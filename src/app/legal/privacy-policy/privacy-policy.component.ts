import { Component, inject, AfterViewInit } from '@angular/core';
import { SharedFunctionsService } from '../../core/services/shared-functions.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements AfterViewInit {
  private sharedSharedFunctionsService = inject(SharedFunctionsService);

  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo(0, 0), 0.25);
  }

  goBack(): void {
    this.sharedSharedFunctionsService.goBack();
  }
}
