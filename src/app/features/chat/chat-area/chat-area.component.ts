import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgFor } from '@angular/common';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-chat-area',
  imports: [MatCardModule, NgFor, MessageInputComponent],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss'
})
export class ChatAreaComponent {
  currentChatName = 'Entwicklerteam';
  memberCount = 3;
  
  // Mock Messages für erste Tests
  mockMessages = [
    {
      id: '1',
      user: 'Noah Braun',
      time: '14:25',
      content: 'Welche Version ist aktuell von Angular?',
      avatar: '/assets/avatars/noah.jpg'
    }
  ];
}