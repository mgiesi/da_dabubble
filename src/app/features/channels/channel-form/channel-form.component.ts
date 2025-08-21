import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-channel-form',
  imports: [NgFor, FormsModule],
  templateUrl: './channel-form.component.html',
  styleUrl: './channel-form.component.scss',
})
export class ChannelFormComponent implements OnInit, OnDestroy {
  facade = inject(ChannelsFacadeService);
  @Output() close = new EventEmitter<void>();
  private subscription = new Subscription();

  channelName = '';
  channelDescription = '';
  channels: any[] = [];

  ngOnInit() {
    this.subscription.add(
      this.facade['data'].channels$().subscribe(channels => {
        this.channels = channels;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async createChannel() {
    if (this.channelName.trim()) {
      await this.facade.createChannel(this.channelName.trim(), this.channelDescription.trim());
      this.channelName = '';
      this.channelDescription = '';
      this.close.emit();
    }
  }

  deleteChannel(channelId: string) {
    this.facade.deleteChannel(channelId);
  }

  onCancel() {
    this.close.emit();
  }
}