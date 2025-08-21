import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { ChannelFormComponent } from '../../channels/channel-form/channel-form.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ChannelFormComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent implements OnInit, OnDestroy {
  private channelsFacade = inject(ChannelsFacadeService);
  private subscription = new Subscription();
  
  workspaceName = 'Devspace';
  channelsClosed = false;
  dmClosed = false;
  showChannelForm = false;
  
  channels: any[] = [];
  directMessages: any[] = [];

  ngOnInit() {
    // Observable verwenden statt Signal
    this.subscription.add(
      this.channelsFacade['data'].channels$().subscribe(channels => {
        this.channels = channels;
        console.log('Channels updated:', channels);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  toggleChannels() {
    this.channelsClosed = !this.channelsClosed;
  }

  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed;
  }

  onAddChannel() {
    this.showChannelForm = true;
  }

  onChannelClick(channelId: string) {
    console.log('Channel clicked:', channelId);
  }

  onDirectMessageClick(userId: string) {
    console.log('DM clicked:', userId);
  }

  onEditWorkspace() {
    console.log('Edit workspace clicked');
  }

  closeChannelForm() {
    this.showChannelForm = false;
  }
}