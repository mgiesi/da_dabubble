import { Component, Input, inject, OnInit } from '@angular/core';
import { NgFor, AsyncPipe } from '@angular/common';
import { ChannelsService } from '../../../core/services/channels.service';
import { UsersService } from '../../../core/services/users.service';
import { User } from '../../../shared/models/user';

/**
 * Component that displays and manages channel members.
 * Shows a list of users who belong to a specific channel with their avatars and names.
 * 
 * @example
 * <app-channel-members [channelId]="selectedChannelId"></app-channel-members>
 */
@Component({
  selector: 'app-channel-members',
  imports: [NgFor],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss'
})
export class ChannelMembersComponent implements OnInit {
  /** The ID of the channel whose members should be displayed */
  @Input() channelId!: string;
  
  private channelsService = inject(ChannelsService);
  private usersService = inject(UsersService);
  
  /** Array of users who are members of the current channel */
  channelMembers: User[] = [];

  /**
   * Initializes the component and loads channel members if channelId is provided.
   */
  async ngOnInit() {
    if (this.channelId) {
      try {
        // Get user IDs from channel members subcollection
        const userIds = await this.channelsService.getChannelMembers(this.channelId);
        
        // Load user details and filter for channel members
        this.usersService.users$().subscribe(users => {
          this.channelMembers = users.filter(user => userIds.includes(user.id || ''));
        });
      } catch (error) {
        console.log('Channel members loading error:', error);
        // Fallback: show first 3 users for testing
        this.usersService.users$().subscribe(users => {
          this.channelMembers = users.slice(0, 3);
        });
      }
    }
  }
}