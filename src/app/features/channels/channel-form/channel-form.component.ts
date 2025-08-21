import { Component, inject } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-channel-form',
  imports: [NgFor],
  templateUrl: './channel-form.component.html',
  styleUrl: './channel-form.component.scss',
})
export class ChannelFormComponent {
  facade = inject(ChannelsFacadeService);

  createChannel() {
    this.facade.createChannel('Test', 'Test Description');
  }

  deleteChannel(channelId: string) {
    this.facade.deleteChannel(channelId);
  }
}
