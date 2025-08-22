// channel-members.component.ts
import { Component, Input, inject, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-channel-members',
  imports: [NgFor],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss'
})
export class ChannelMembersComponent implements OnInit {
  @Input() channelId!: string;
  
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  
  channelMembers: User[] = [];

  ngOnInit() {
    if (this.channelId) {
      // Erstmal alle Users laden, da Member-Funktionalität fehlt
      const allUsers = this.usersFacade.users();
      this.channelMembers = allUsers?.slice(0, 5) || [];
    }
  }
}