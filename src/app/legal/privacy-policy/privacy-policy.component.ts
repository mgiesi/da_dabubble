import {
  Component,
  inject,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedFunctionsService } from '../../core/services/shared-functions.service';

@Component({
  selector: 'app-privacy-policy',
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent implements AfterViewInit {
  private sharedSharedFunctionsService = inject(SharedFunctionsService);
  showScrollTopBtn = false;

  @ViewChild('appContainer', { static: false }) appContainerRef?: ElementRef;

  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo(0, 0), 100);
    const appContainer = this.appContainerRef?.nativeElement;
    if (appContainer) {
      appContainer.addEventListener('scroll', this.onScroll.bind(this));
      this.onScroll();
    }
  }

  onScroll(): void {
    const appContainer = this.appContainerRef?.nativeElement;
    if (appContainer) {
      this.showScrollTopBtn = appContainer.scrollTop > 250;
    }
  }

  scrollToTop(): void {
    const appContainer = this.appContainerRef?.nativeElement;
    if (appContainer) {
      appContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goBack(): void {
    this.sharedSharedFunctionsService.goBack();
  }
}
