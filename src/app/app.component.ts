import { Component, inject } from "@angular/core"
import { RouterOutlet, Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { ProfileMenuComponent } from "./features/profile/profile-menu/profile-menu.component"
import { AuthService } from "./core/services/auth.service"
import { SharedFunctionsService } from "../../src/app/core/services/shared-functions.service"
import { LogoStateService } from "./core/services/logo-state.service"

@Component({
  selector: "app-root",
  imports: [RouterOutlet, CommonModule, ProfileMenuComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private router = inject(Router);
  title = "DABubble"
  private auth = inject(AuthService)
  private sharedFunctions = inject(SharedFunctionsService)
  private logoState = inject(LogoStateService)

  isAuthenticated$ = this.auth.isAuthenticated$
  showAnimation$ = this.sharedFunctions.showAnimation$

  readonly logoSrc = this.logoState.logoSrc
  readonly headerTitle = this.logoState.headerTitle
  readonly showBackArrow = this.logoState.showBackArrow

  onBackClick() {
  const isMobile = window.innerWidth < 768; // prüfe < $main_layout_mobile
  this.logoState.setCurrentView('workspace');
  if (isMobile) this.router.navigate(['/m/workspace'], { replaceUrl: true });
}

}
