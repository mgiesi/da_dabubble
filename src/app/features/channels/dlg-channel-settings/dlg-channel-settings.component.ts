import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, OnInit, Output, signal, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { Channel } from '../../../shared/models/channel';
import { FormsModule } from '@angular/forms';
import { User } from '../../../shared/models/user';
import { Router } from '@angular/router';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';

export type ChannelSettingsData = {
  channelId: string,
  channelName: string,
  channelDescription: string,
  createdByName: string
};

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

  parentDesktopDialogRef = inject(MatDialogRef<DlgChannelSettingsComponent>, {
    optional: true,
  });
  parentMobileDialogRef = inject(MatBottomSheetRef<DlgChannelSettingsComponent>, {
    optional: true,
  });
  
  private dlgData = inject<ChannelSettingsData | null>(MAT_DIALOG_DATA, { optional: true });
  private sheetData  = inject<ChannelSettingsData | null>(MAT_BOTTOM_SHEET_DATA, { optional: true });

  readonly dialogData: ChannelSettingsData = this.dlgData ?? this.sheetData ?? { channelId: '',
    channelName: '',
    channelDescription: '',
    createdByName: '' };

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
    this.parentDesktopDialogRef?.close(false);
    this.parentMobileDialogRef?.dismiss(false);
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
      
      this.parentDesktopDialogRef?.close(true);
      this.parentMobileDialogRef?.dismiss(true);
    } catch (error) {
      console.error('Fehler beim Verlassen des Channels:', error);
    } finally {
      this.isUpdating = false;
    }
  }
}
