import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from "@angular/core"
import { DomSanitizer, SafeHtml } from "@angular/platform-browser"
import { MatDialog } from "@angular/material/dialog"
import { DlgProfileDetailsComponent } from "../../../profile/dlg-profile-details/dlg-profile-details.component"
import { UsersFacadeService } from "../../../../core/facades/users-facade.service"

@Component({
  selector: "app-message-bubble",
  standalone: true,
  imports: [],
  templateUrl: "./message-bubble.component.html",
  styleUrls: ["./message-bubble.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  get parsedMessageText(): SafeHtml {
    const text = this.message?.text || this.message?.content || ''
    const parsed = this.parseMentions(text)
    return this.sanitizer.bypassSecurityTrustHtml(parsed)
  }

  private parseMentions(text: string): string {
    const users = this.usersFacade.users()
    if (!users) return text

    const sortedUsers = [...users].sort((a, b) => 
      (b.displayName?.length || 0) - (a.displayName?.length || 0)
    )

    let parsed = text
    sortedUsers.forEach(user => {
      if (!user.displayName) return
      const mention = `@${user.displayName}`
      const regex = new RegExp(mention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      parsed = parsed.replace(regex, 
        `<span class="mention-link" data-username="${user.displayName}">${mention}</span>`
      )
    })

    return parsed
  }

  onMentionClick(event: Event): void {
    const target = event.target as HTMLElement
    if (target.classList.contains('mention-link')) {
      const username = target.getAttribute('data-username')
      if (username) {
        this.openUserProfile(username)
      }
    }
  }

  private openUserProfile(username: string): void {
    const users = this.usersFacade.users()
    if (!users) return
    
    const user = users.find(u => u.displayName === username)
    if (user?.id) {
      console.log('Opening profile for:', username, user.id)
      this.dialog.open(DlgProfileDetailsComponent, {
        data: { userId: user.id }
      })
    } else {
      console.log('User not found:', username)
    }
  }

  onReplyClick(): void { 
    this.replyClicked.emit(this.message) 
  }

  onEmojiPickerToggle(event: MouseEvent): void { 
    this.emojiPickerToggled.emit(event) 
  }
}