import { Component, Input, inject, OnInit, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgFor } from '@angular/common';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChannelsService } from '../../../core/services/channels.service';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../shared/models/user';
import { Channel } from '../../../shared/models/channel';

/**
 * Main chat area component that displays channel information, messages, and input field.
 * Shows the selected channel's header with member avatars, message area, and message input.
 * 
 * @example
 * <app-chat-area [channelId]="selectedChannelId"></app-chat-area>
 */
@Component({
  selector: 'app-chat-area',
  imports: [MatCardModule, NgFor, MessageInputComponent],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss'
})
export class ChatAreaComponent implements OnInit, OnChanges {
  /** The ID of the channel to display */
  @Input() channelId!: string;

  private channelsService = inject(ChannelsService);
  private usersService = inject(UsersService);

  /** The currently selected channel object */
  currentChannel: Channel | null = null;
  
  /** Number of members in the current channel */
  memberCount = 0;
  
  /** Array of users who are members of the current channel */
  members: User[] = [];
  
  /** Flag to show/hide the detailed members list */
  showMembersList = false;

  /** Mock message data for testing purposes - will be replaced with real messages */
  mockMessages = [
    {
      id: '1',
      user: 'Noah Braun',
      time: '14:25',
      content: 'Welche Version ist aktuell von Angular?',
      avatar: '/assets/avatars/noah.jpg'
    }
  ];

  /**
   * Initializes the component and loads channel data if channelId is provided.
   */
  async ngOnInit() {
    if (this.channelId) {
      await this.loadChannelData();
      await this.loadChannelMembers();
    }
  }

  /**
   * Handles changes to input properties, specifically when channelId changes.
   * Reloads channel data and members when a new channel is selected.
   */
  ngOnChanges() {
    if (this.channelId) {
      this.loadChannelData();
      this.loadChannelMembers();
    }
  }

  /**
   * Loads the channel details from the database.
   * Subscribes to the channels observable and finds the matching channel by ID.
   */
  async loadChannelData() {
    this.channelsService.channels$().subscribe(channels => {
      this.currentChannel = channels.find(c => c.id === this.channelId) || null;
    });
  }

  /**
   * Loads the members of the current channel.
   * Gets user IDs from channel members subcollection and fetches user details.
   */
  async loadChannelMembers() {
    try {
      const userIds = await this.channelsService.getChannelMembers(this.channelId);
      this.memberCount = userIds.length;

      this.usersService.users$().subscribe(allUsers => {
        this.members = allUsers.filter(user => userIds.includes(user.id || ''));
      });
    } catch (error) {
      console.error('Failed to load channel members:', error);
    }
  }

  /**
   * Gets the display name for the current chat.
   * Returns the channel name or a fallback if no channel is selected.
   * 
   * @returns The name of the current channel or 'Entwicklerteam' as fallback
   */
  get currentChatName(): string {
    return this.currentChannel?.name || 'Entwicklerteam';
  }
}