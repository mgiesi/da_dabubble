import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { Channel } from '../../../shared/models/channel';
import { FormsModule } from '@angular/forms';
import { User } from '../../../shared/models/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dlg-channel-settings',
  imports: [CommonModule, MatDialogContent, FormsModule],
  templateUrl: './dlg-channel-settings.component.html',
  styleUrl: './dlg-channel-settings.component.scss'
})
export class DlgChannelSettingsComponent {

  private router = inject(Router);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  private dialogRef = inject(MatDialogRef<DlgChannelSettingsComponent>);

  readonly dialogData = inject<{ 
    channelId: string | undefined, 
    channelName: string | undefined, 
    channelDescription: string | undefined,
    createdByName: string | undefined }>(MAT_DIALOG_DATA);

  @Output() saved = new EventEmitter<void>();
    
  isUpdating = false;
  editingName = false;
  editingDescription = false;

  // Temporary values for editing
  tempChannelName = '';
  tempChannelDescription = '';
  channelExists: boolean = false;
  channelNameEmpty: boolean = true;
  hasUserTypedName: boolean = false;
  
  public closeDialog() {
    this.dialogRef.close(false);
  }

  onChannelChange() {
    this.hasUserTypedName = true;
    this.checkIfChannelExists();
  }

  checkIfChannelExists() {
    const channel = this.channelsFacade.getChannelByName(this.tempChannelName);
    this.channelExists = channel != undefined && channel != null && this.tempChannelName !== this.dialogData.channelName;
    this.channelNameEmpty = this.tempChannelName != null && this.tempChannelName.length <= 0;
  }

  editChannelName() {
    this.editingName = true;
    this.tempChannelName = this.dialogData.channelName ?? "";
  }

  cancelNameEdit() {
    this.editingName = false;
  }

  async saveChannelName() {
    if (!this.tempChannelName.trim() || this.isUpdating) return;

    const id = this.dialogData.channelId;
    if (!id) return;
      
    try {
      this.isUpdating = true;
      await this.channelsFacade.renameChannel(id, this.tempChannelName.trim());
      this.dialogData.channelName = this.tempChannelName.trim();
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
    this.tempChannelDescription = this.dialogData.channelDescription ?? "";
  }

  cancelDescriptionEdit() {
    this.editingDescription = false;
  }

  async saveDescription() {
    if (this.isUpdating) return;

    const id = this.dialogData.channelId;
    if (!id) return;

    try {
      this.isUpdating = true;
      await this.channelsFacade.updateDescription(id, this.tempChannelDescription.trim());
      this.dialogData.channelDescription = this.tempChannelDescription.trim();
      this.editingDescription = false;
      this.saved.emit();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Beschreibung:', error);
    } finally {
      this.isUpdating = false;
    }
  }

  async onLeaveChannel() {
    if (this.isUpdating) return;

    const id = this.dialogData.channelId;
    if (!id) return;

    try {
      this.isUpdating = true;
      
      const userId = this.usersFacade.currentUserSig()?.id;
      if (!userId) return;

      await this.channelsFacade.removeMemberFromChannel(id, userId);
      
      this.router.navigate(['/workspace']);
    } catch (error) {
      console.error('Fehler beim Verlassen des Channels:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}
