import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';

@Component({
  selector: 'app-channel-settings',
  imports: [FormsModule, NgIf],
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
  private usersFacade = inject(UsersFacadeService);

  isUpdating = false;
  editingName = false;
  editingDescription = false;

  // Temporary values for editing
  tempChannelName = '';
  tempChannelDescription = '';

  ngOnInit() {
    this.tempChannelName = this.channelName;
    this.tempChannelDescription = this.channelDescription;
  }

  editChannelName() {
    this.editingName = true;
    this.tempChannelName = this.channelName;
  }

  cancelNameEdit() {
    this.editingName = false;
    this.tempChannelName = this.channelName;
  }

  async saveChannelName() {
    if (!this.tempChannelName.trim() || this.isUpdating) return;

    try {
      this.isUpdating = true;
      await this.channelsFacade.renameChannel(this.channelId, this.tempChannelName.trim());
      this.channelName = this.tempChannelName.trim();
      this.editingName = false;
      this.saved.emit();
    } catch (error) {
      console.error('Fehler beim Umbenennen:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  editDescription() {
    this.editingDescription = true;
    this.tempChannelDescription = this.channelDescription;
  }

  cancelDescriptionEdit() {
    this.editingDescription = false;
    this.tempChannelDescription = this.channelDescription;
  }

  async saveDescription() {
    if (this.isUpdating) return;

    try {
      this.isUpdating = true;
      await this.channelsFacade.updateDescription(this.channelId, this.tempChannelDescription.trim());
      this.channelDescription = this.tempChannelDescription.trim();
      this.editingDescription = false;
      this.saved.emit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Beschreibung:', error);
    } finally {
      this.isUpdating = false;
    }
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
      
      const userId = this.usersFacade.currentUserSig()?.id;
      if (!userId) return;

      await this.channelsFacade.removeMemberFromChannel(this.channelId, userId);
      this.left.emit();
    } catch (error) {
      console.error('Fehler beim Verlassen des Channels:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  onClose() {
    this.close.emit();
  }
}