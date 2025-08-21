import { Component, inject } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-channel-form',
  imports: [NgFor, RouterLink],
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
