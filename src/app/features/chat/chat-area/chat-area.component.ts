// src/app/features/chat/chat-area/chat-area.component.ts

import { Component, Output, Input, inject, type OnInit, type OnChanges, EventEmitter, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef, Renderer2, AfterViewInit } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { NgFor, NgIf } from "@angular/common";
import { MessageInputComponent } from "../message-input/message-input.component";
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service";
import { UsersFacadeService } from "../../../core/facades/users-facade.service";
import { MessagesFacadeService, type Message } from "../../../core/facades/messages-facade.service";
import type { User } from "../../../shared/models/user";
import type { Channel } from "../../../shared/models/channel";
import { MessageItemComponent } from "../message-item/message-item.component";
import { Router } from "@angular/router";
import { LogoStateService } from "../../../core/services/logo-state.service";
import { MessagesService } from '../../../core/repositories/messages.service';
import { ChannelSettingsComponent } from "../../channels/channel-settings/channel-settings.component";

@Component({
  selector: "app-chat-area",
  imports: [MatCardModule, NgFor, NgIf, MessageInputComponent, MessageItemComponent, ChannelSettingsComponent],
  templateUrl: "./chat-area.component.html",
  styleUrl: "./chat-area.component.scss",
})
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() channelId: string | null = null;
  @Output() threadOpened = new EventEmitter<any>();
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;

  private router = inject(Router);
  private logoState = inject(LogoStateService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  private messagesFacade = inject(MessagesFacadeService);
  private cdr = inject(ChangeDetectorRef);
  private messagesService = inject(MessagesService);
  private renderer = inject(Renderer2);

  private messageSubscription: (() => void) | null = null;
  private previousChannelId: string | null = null;

  currentChannel: Channel | null = null;
  memberCount = 0;
  members: User[] = [];
  showMembersList = false;
  createdByName = "";
  messages: Message[] = [];
  isLoadingMessages = false;
  showSettings = false;

  async ngOnInit() {
    if (this.channelId) {
      await this.runMigration();
      await this.initializeChannel();
      this.logoState.setCurrentView("chat");
    }
  }

  ngAfterViewInit() {
    // ViewChild is available now
  }

  async ngOnChanges() {
    const channelChanged = this.channelId !== this.previousChannelId;
    if (channelChanged) {
      this.previousChannelId = this.channelId;
      this.cleanupSubscription();
      if (this.channelId) {
        await this.initializeChannel();
      }
    }
  }

  ngOnDestroy() {
    this.cleanupSubscription();
  }

  /**
   * Initializes channel with all data
   */
  private async initializeChannel() {
    if (!this.channelId) return;

    this.isLoadingMessages = true;
    await Promise.all([
      this.loadChannelData(),
      this.loadChannelMembers(),
      this.setupMessageSubscription()
    ]);
    this.isLoadingMessages = false;
  }

  /**
   * Sets up message subscription with scroll
   */
  private async setupMessageSubscription() {
    if (!this.channelId) return;

    this.messageSubscription = this.messagesFacade.subscribeToChannelMessages(
      this.channelId,
      (messages) => {
        this.messages = messages;
        this.cdr.detectChanges();
        this.scrollToBottomAfterUpdate();
      }
    );
  }

  /**
   * Scrolls to bottom after message update
   */
  private scrollToBottomAfterUpdate() {
    setTimeout(() => {
      this.scrollToBottom();
      this.waitForImagesToLoad();
    }, 1);
  }

  /**
   * Scrolls messages container to bottom
   */
  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      const element = this.messagesContainer.nativeElement;
      this.renderer.setProperty(element, 'scrollTop', element.scrollHeight);
    }
  }

  /**
   * Waits for images and scrolls again
   */
  private waitForImagesToLoad() {
    if (!this.messagesContainer?.nativeElement) return;

    const images = this.messagesContainer.nativeElement.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    if (totalImages === 0) return;

    images.forEach((img: HTMLImageElement) => {
      if (img.complete) {
        loadedImages++;
        if (loadedImages === totalImages) {
          this.scrollToBottom();
        }
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            this.scrollToBottom();
          }
        };
      }
    });
  }

  /**
   * Cleans up message subscription
   */
  private cleanupSubscription() {
    if (this.messageSubscription) {
      this.messageSubscription();
      this.messageSubscription = null;
    }
  }

  /**
   * Loads channel data from facade
   */
  private async loadChannelData() {
    const channels = this.channelsFacade.channels();
    this.currentChannel = channels.find((c) => c.id === this.channelId) || null;

    if (this.currentChannel?.ownerId) {
      const allUsers = this.usersFacade.users();
      const creator = allUsers?.find(user => user.id === this.currentChannel?.ownerId);
      this.createdByName = creator?.displayName || 'Unbekannt';
    }
  }

  /**
   * Loads channel members with fallback
   */
  private async loadChannelMembers() {
    if (!this.channelId) return;

    try {
      const userIds = await this.channelsFacade.getChannelMembers(this.channelId);
      this.memberCount = userIds.length;

      const allUsers = this.usersFacade.users();
      if (allUsers) {
        this.members = allUsers.filter((user) => userIds.includes(user.id || ""));
      }
    } catch (error) {
      console.error("Failed to load channel members:", error);
      const allUsers = this.usersFacade.users();
      this.memberCount = Math.min(allUsers?.length || 1, 5);
      this.members = allUsers?.slice(0, this.memberCount) || [];
    }
  }

  /**
   * Runs migration for old reactions
   */
  async runMigration() {
    try {
      await this.messagesService.migrateOldReactions();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  get currentChatName(): string {
    return this.currentChannel?.name || "Entwicklerteam";
  }

  get currentChatDescription(): string {
    return this.currentChannel?.description || "";
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id || index.toString();
  }

  onReplyToMessage(message: Message) {
    this.threadOpened.emit(message);
  }

  onAddMember() {
    console.log("Add member to channel:", this.channelId);
  }

  openThread(threadId: string) {
    this.logoState.setCurrentView("thread");
    if (this.logoState.showBackArrow()) {
      this.router.navigate(["/m/thread", threadId]);
    }
  }

  openSettings() {
    this.showSettings = true;
  }

  closeSettings() {
    this.showSettings = false;
  }

  onSettingsSaved() {
    this.closeSettings();
    this.loadChannelData();
  }

  onChannelLeft() {
    this.closeSettings();
    this.router.navigate(['/workspace']);
  }
}