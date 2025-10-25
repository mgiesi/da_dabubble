import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from "@angular/core"
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser"
import { MatDialog } from "@angular/material/dialog"
import { DlgProfileDetailsComponent } from "../../../profile/dlg-profile-details/dlg-profile-details.component"
import { UsersFacadeService } from "../../../../core/facades/users-facade.service"
import { ChannelsFacadeService } from "../../../../core/facades/channels-facade.service"
import { ChannelNavigationService } from "../../../../core/services/channel-navigation.service"

@Component({
  selector: "app-message-bubble",
  standalone: true,
  imports: [],
  templateUrl: "./message-bubble.component.html",
  styleUrls: ["./message-bubble.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageBubbleComponent {
  @Input() message: any
  @Input() messageUser: any
  @Input() isOwnMessage = false
  @Output() replyClicked = new EventEmitter<any>()
  @Output() emojiPickerToggled = new EventEmitter<MouseEvent>()

  private sanitizer = inject(DomSanitizer)
  private dialog = inject(MatDialog)
  private usersFacade = inject(UsersFacadeService)
  private channelsFacade = inject(ChannelsFacadeService)
  private channelNavigationService = inject(ChannelNavigationService)

  get parsedMessageText(): SafeHtml {
    const text = this.message?.text || this.message?.content || ""
    let parsed = this.parseMentions(text)
    parsed = this.parseChannels(parsed)
    return this.sanitizer.bypassSecurityTrustHtml(parsed)
  }

  private parseMentions(text: string): string {
    const users = this.usersFacade.users()
    if (!users) return text

    const sortedUsers = [...users].sort((a, b) => (b.displayName?.length || 0) - (a.displayName?.length || 0))

    let parsed = text
    sortedUsers.forEach((user) => {
      if (!user.displayName) return
      const mention = `@${user.displayName}`
      const regex = new RegExp(mention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      parsed = parsed.replace(regex, `<span class="mention-link" data-username="${user.displayName}">${mention}</span>`)
    })

    return parsed
  }

  private parseChannels(text: string): string {
    const channels = this.channelsFacade.channels()
    if (!channels) return text

    const sortedChannels = [...channels].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0))

    let parsed = text
    sortedChannels.forEach((channel) => {
      if (!channel.name || !channel.id) return
      const channelMention = `#${channel.name}`
      const regex = new RegExp(channelMention.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      parsed = parsed.replace(
        regex,
        `<span class="channel-link" data-channelid="${channel.id}" data-channelname="${channel.name}">${channelMention}</span>`,
      )
    })

    return parsed
  }

  onMentionClick(event: Event): void {
    const target = event.target as HTMLElement

    if (target.classList.contains("mention-link")) {
      const username = target.getAttribute("data-username")
      if (username) {
        this.openUserProfile(username)
      }
    } else if (target.classList.contains("channel-link")) {
      const channelId = target.getAttribute("data-channelid")
      if (channelId) {
        this.navigateToChannel(channelId)
      }
    }
  }

  private openUserProfile(username: string): void {
    const users = this.usersFacade.users()
    if (!users) return

    const user = users.find((u) => u.displayName === username)
    if (user?.id) {
      this.dialog.open(DlgProfileDetailsComponent, {
        data: { userId: user.id },
      })
    } else {
      console.log("User not found:", username)
    }
  }

  private navigateToChannel(channelId: string): void {
    this.channelNavigationService.selectChannel(channelId)
  }

  onReplyClick(): void {
    this.replyClicked.emit(this.message)
  }

  onEmojiPickerToggle(event: MouseEvent): void {
    this.emojiPickerToggled.emit(event)
  }
}
