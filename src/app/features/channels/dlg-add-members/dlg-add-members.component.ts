import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Signal } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { Channel } from '../../../shared/models/channel';

@Component({
  selector: 'app-dlg-add-members',
  imports: [NgIf, MatDialogContent],
  templateUrl: './dlg-add-members.component.html',
  styleUrl: './dlg-add-members.component.scss'
})
export class DlgAddMembersComponent {
  private channelFacade = inject(ChannelsFacadeService);
  private dialogRef = inject(MatDialogRef<DlgAddMembersComponent>);
  
  readonly channel = inject<Signal<Channel | null>>(MAT_DIALOG_DATA);

  closeDialog() {
    this.dialogRef.close(false);
  }
}
