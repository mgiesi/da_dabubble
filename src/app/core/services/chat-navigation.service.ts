import { Injectable, inject } from "@angular/core"
import { DmNavigationService } from "./dm-navigation.service"
import { ChannelNavigationService } from "./channel-navigation.service"

@Injectable({ providedIn: "root" })
export class ChatNavigationService {
  private dmNavigation = inject(DmNavigationService)
  private channelNavigation = inject(ChannelNavigationService)

  // Expose observables from separate services
  dmSelected$ = this.dmNavigation.dmSelected$
  channelSelected$ = this.channelNavigation.channelSelected$

  selectUser(userId: string) {
    this.dmNavigation.selectUser(userId)
  }

  selectChannel(channelId: string) {
    this.channelNavigation.selectChannel(channelId)
  }
}
