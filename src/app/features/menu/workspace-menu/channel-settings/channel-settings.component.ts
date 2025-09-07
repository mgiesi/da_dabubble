import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelsFacadeService } from '../../../../core/facades/channels-facade.service';

@Component({
  selector: 'app-channel-settings',
  imports: [FormsModule],
  templateUrl: './channel-settings.component.html',
  styleUrl: './channel-settings.component.scss'
})
export class ChannelSettingsComponent implements OnInit {
  @Input() channelId = '';
  @Input() channelName = '';
  @Input() channelDescription = '';
  @Input() createdByName = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() left = new EventEmitter<void>();

  private channelsFacade = inject(ChannelsFacadeService);

  isUpdating = false;
  editingName = false;
  editingDescription = false;

  ngOnInit() {
    // Input properties are already set via binding
  }

  async onUpdateChannel() {
    if (!this.channelId || !this.channelName.trim() || this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      // Use separate calls for name and description updates
      await this.channelsFacade.renameChannel(this.channelId, this.channelName.trim());
      await this.channelsFacade.updateDescription(this.channelId, this.channelDescription.trim());
      this.saved.emit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async onLeaveChannel() {
    if (!this.channelId || this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      // For now, use deleteChannel as leaveChannel doesn't exist yet
      // TODO: Implement proper leaveChannel functionality
      console.log('Channel verlassen - Funktionalität noch nicht implementiert');
      this.left.emit();
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