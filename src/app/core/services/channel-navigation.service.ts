import { Injectable } from "@angular/core"
import { Subject } from "rxjs"

@Injectable({ providedIn: "root" })
export class ChannelNavigationService {
  private channelSelectedSource = new Subject<string>()
  channelSelected$ = this.channelSelectedSource.asObservable()

  selectChannel(channelId: string) {
    this.channelSelectedSource.next(channelId)
  }
}
