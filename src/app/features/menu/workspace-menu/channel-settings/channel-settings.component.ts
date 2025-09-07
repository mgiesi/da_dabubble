import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelsFacadeService } from '../../../../core/facades/channels-facade.service';
import { Channel } from '../../../../shared/models/channel';

@Component({
  selector: 'app-channel-settings',
  imports: [FormsModule],
  templateUrl: './channel-settings.component.html',
  styleUrl: './channel-settings.component.scss'
})
export class ChannelSettingsComponent {
  @Input() channel: Channel | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() channelLeft = new EventEmitter<void>();

  private channelsFacade = inject(ChannelsFacadeService);

  channelName = '';
  channelDescription = '';
  isUpdating = false;

  ngOnInit() {
    if (this.channel) {
      this.channelName = this.channel.name;
      this.channelDescription = this.channel.description || '';
    }
  }

  async onUpdateChannel() {
    if (!this.channel || !this.channelName.trim() || this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      await this.channelsFacade.updateChannel(this.channel.id, {
        name: this.channelName.trim(),
        description: this.channelDescription.trim()
      });
      this.close.emit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async onLeaveChannel() {
    if (!this.channel || this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      await this.channelsFacade.leaveChannel(this.channel.id);
      this.channelLeft.emit();
      this.close.emit();
    } catch (error) {
      console.error('Fehler beim Verlassen:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  onClose() {
    this.close.emit();
  }
}