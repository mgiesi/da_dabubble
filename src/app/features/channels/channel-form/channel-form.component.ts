import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-channel-form',
  imports: [FormsModule, MatCardModule],
  templateUrl: './channel-form.component.html',
  styleUrl: './channel-form.component.scss',
})
export class ChannelFormComponent implements OnInit, OnDestroy {
  facade = inject(ChannelsFacadeService);
  @Output() close = new EventEmitter<void>();
  private subscription = new Subscription();

  name = '';
  description = '';
  allChannels: any[] = [];

  ngOnInit() {
    this.subscription.add(
      this.facade['data'].channels$().subscribe(channels => {
        this.allChannels = channels;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async createChannel() {
    if (this.name.trim()) {
      await this.facade.createChannel(this.name.trim(), this.description.trim());
      this.name = '';
      this.description = '';
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