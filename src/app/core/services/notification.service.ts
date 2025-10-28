import { Injectable, inject, effect } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { Auth } from "@angular/fire/auth"
import { toSignal } from "@angular/core/rxjs-interop"
import { DirectMessagesFacadeService } from "../facades/direct-messages-facade.service"
import { UsersFacadeService } from "../facades/users-facade.service"

export interface UnreadMessage {
  userId: string
  count: number
}

export interface ToastData {
  message: string
  type: "dm" | "channel"
  userId?: string
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private auth = inject(Auth)
  private dmFacade = inject(DirectMessagesFacadeService)
  private usersFacade = inject(UsersFacadeService)

  private unreadMessages$ = new BehaviorSubject<Map<string, number>>(new Map())
  private toastTrigger$ = new BehaviorSubject<ToastData | null>(null)

  unreadMessages = this.unreadMessages$.asObservable()
  toastTrigger = this.toastTrigger$.asObservable()

  private unreadSignal = toSignal(this.unreadMessages$, { initialValue: new Map() })

  private dmSubscriptions: Map<string, () => void> = new Map()
  private lastMessageCounts: Map<string, number> = new Map()
  private activeUserId: string | null = null
  private justLoggedIn = false
  private readonly STORAGE_KEY_INITIAL_LOAD = "notification_initial_load"
  private readonly STORAGE_KEY_UNREAD = "notification_unread_counts"
  private readonly STORAGE_KEY_LAST_COUNTS = "notification_last_counts"

  constructor() {
    this.loadPersistedState()

    effect(() => {
      const currentUser = this.usersFacade.currentUserSig()
      if (currentUser) {
        this.justLoggedIn = true
        this.initializeGlobalDMListener()
        setTimeout(() => {
          this.justLoggedIn = false
        }, 1000)
      }
    })
  }

  private loadPersistedState() {
    try {
      // Lade Unread Counts
      const unreadData = localStorage.getItem(this.STORAGE_KEY_UNREAD)
      if (unreadData) {
        const unreadMap = new Map<string, number>(JSON.parse(unreadData))
        this.unreadMessages$.next(unreadMap)
      }

      // Lade Last Message Counts
      const lastCountsData = localStorage.getItem(this.STORAGE_KEY_LAST_COUNTS)
      if (lastCountsData) {
        this.lastMessageCounts = new Map<string, number>(JSON.parse(lastCountsData))
      }
    } catch (error) {
    }
  }

  private persistState() {
    try {
      const unreadArray = Array.from(this.unreadMessages$.value.entries())
      localStorage.setItem(this.STORAGE_KEY_UNREAD, JSON.stringify(unreadArray))

      const lastCountsArray = Array.from(this.lastMessageCounts.entries())
      localStorage.setItem(this.STORAGE_KEY_LAST_COUNTS, JSON.stringify(lastCountsArray))
    } catch (error) {
    }
  }

  setActiveChat(userId: string | null) {
    this.activeUserId = userId
  }

  private initializeGlobalDMListener() {
    const users = this.usersFacade.users()
    const currentUserId = this.auth.currentUser?.uid

    if (!users || !currentUserId) return

    users.forEach((user) => {
      if (user.id === currentUserId || user.uid === currentUserId) return

      if (this.dmSubscriptions.has(user.id)) {
        this.dmSubscriptions.get(user.id)!()
      }

      const unsubscribe = this.dmFacade.subscribeToDMMessages(user.id, (messages) =>
        this.handleDMUpdate(user.id, messages),
      )

      this.dmSubscriptions.set(user.id, unsubscribe)
    })
  }

  private async handleDMUpdate(userId: string, messages: any[]) {
    const lastMessage = messages[messages.length - 1]
    const currentUserId = this.auth.currentUser?.uid
    const previousCount = this.lastMessageCounts.get(userId) || 0

    const hasNewMessage = messages.length > previousCount

    // ✅ Normalisiere senderId zu Auth UID
    const senderAuthUid = await this.normalizeToAuthUid(lastMessage?.senderId)
    const isFromOtherUser = lastMessage && senderAuthUid !== currentUserId

    const isChatInactive = this.activeUserId !== userId
    const isTabVisible = document.visibilityState === "visible"
    const isLoginPhase = this.justLoggedIn

    if (hasNewMessage && isFromOtherUser && isChatInactive) {
      const newMessageCount = messages.length - previousCount
      this.incrementUnreadBy(userId, newMessageCount)

      if (isTabVisible && !isLoginPhase) {
        this.playSound("dm")
      }
    }

    this.lastMessageCounts.set(userId, messages.length)
    this.persistState()
  }

  /**
   * ✅ Normalisiere User-ID zu Firebase Auth UID
   * Falls es eine Firestore Document-ID ist, hole die Auth UID aus den Users
   */
  private async normalizeToAuthUid(userIdOrDocId: string | undefined): Promise<string | undefined> {
    if (!userIdOrDocId) return undefined

    // Prüfe ob es bereits eine Auth UID ist (28 Zeichen)
    if (this.isAuthUid(userIdOrDocId)) {
      return userIdOrDocId
    }

    // Sonst ist es eine Document-ID → hole die Auth UID aus den Users
    const users = this.usersFacade.users()
    const user = users?.find((u) => u.id === userIdOrDocId)
    return user?.uid || userIdOrDocId
  }

  /**
   * Prüft ob ein String eine Firebase Auth UID ist
   */
  private isAuthUid(id: string): boolean {
    return id.length === 28 && /^[a-zA-Z0-9]+$/.test(id)
  }

  playSound(type: "dm" | "channel") {
    const audio = new Audio(type === "dm" ? "/audio/message_2.mp3" : "/audio/message.mp3")
    audio.volume = 0.5
    audio.play().catch((err) => console.log("Audio play failed:", err))
  }

  showToast(message: string, type: "dm" | "channel", userId?: string) {
    this.toastTrigger$.next({ message, type, userId })
  }

  incrementUnreadBy(userId: string, count: number) {
    const current = this.unreadMessages$.value
    const currentCount = current.get(userId) || 0
    const newCount = currentCount + count
    current.set(userId, newCount)
    this.unreadMessages$.next(new Map(current))
    this.persistState()
  }

  incrementUnread(userId: string) {
    this.incrementUnreadBy(userId, 1)
  }

  clearUnread(userId: string) {
    const current = this.unreadMessages$.value
    current.delete(userId)
    this.unreadMessages$.next(new Map(current))
    this.persistState()
  }

  getUnreadCount(userId: string): number {
    return this.unreadSignal().get(userId) || 0
  }

  get currentUserId(): string | undefined {
    return this.auth.currentUser?.uid
  }

  ngOnDestroy() {
    this.dmSubscriptions.forEach((unsubscribe) => unsubscribe())
    this.dmSubscriptions.clear()
  }
}