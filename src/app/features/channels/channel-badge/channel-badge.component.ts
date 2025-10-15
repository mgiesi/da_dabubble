import { Component, input, InputSignal } from '@angular/core';
import { Channel } from '../../../shared/models/channel';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-channel-badge',
  imports: [CommonModule],
  templateUrl: './channel-badge.component.html',
  styleUrl: './channel-badge.component.scss'
})
export class ChannelBadgeComponent {
  
  // Input variable to link this component with a channel
  channel: InputSignal<Channel | null> = input<Channel | null>(null);
}
