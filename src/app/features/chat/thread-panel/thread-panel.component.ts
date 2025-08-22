import { Component, Input } from '@angular/core';
import { inject } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { NgFor } from '@angular/common';
import { MessageItemComponent } from '../message-item/message-item.component';
import { MessageInputComponent } from '../message-input/message-input.component';



@Component({
  selector: 'app-thread-panel',
  imports: [NgFor, MessageItemComponent, MessageInputComponent],
  templateUrl: './thread-panel.component.html',
  styleUrl: './thread-panel.component.scss'
})
export class ThreadPanelComponent {
  @Input() message: any = null;
  private mockData = inject(MockDataService);

  get threadMessages() {
    return this.message ? this.mockData.getThreadMessages(this.message.id) : [];
  }
}