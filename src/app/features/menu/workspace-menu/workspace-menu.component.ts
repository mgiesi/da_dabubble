import { Component, inject, OnInit, Output, OnDestroy, EventEmitter } from '@angular/core';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { ChannelFormComponent } from '../../channels/channel-form/channel-form.component';

/**
 * Workspace menu component that displays channels and direct messages in a sidebar.
 * Allows users to select channels, toggle sections, and create new channels.
 * Emits events when channels are selected to communicate with parent components.
 * 
 * @example
 * <app-workspace-menu (channelSelected)="onChannelSelected($event)"></app-workspace-menu>
 */
@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ChannelFormComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent implements OnInit {
  @Output() channelSelected = new EventEmitter<string>();

  private channelsFacade = inject(ChannelsFacadeService);

  /** Name of the current workspace */
  workspaceName = 'Devspace';

  /** Flag to control if channels section is collapsed */
  channelsClosed = false;

  /** Flag to control if direct messages section is collapsed */
  dmClosed = false;

  /** Flag to control if channel creation form is visible */
  showChannelForm = false;

  /** Array of direct message conversations */
  directMessages: any[] = [];

  get channels() {
    return this.channelsFacade.channels();
  }

  /**
   * Initializes the component and subscribes to channels data.
   */
  ngOnInit() {
    console.log('Channels loaded via signal:', this.channels);
  }

  /**
   * Toggles the visibility of the channels section.
   */
  toggleChannels() {
    this.channelsClosed = !this.channelsClosed;
  }

  /**
   * Toggles the visibility of the direct messages section.
   */
  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed;
  }

  /**
   * Opens the channel creation form.
   */
  onAddChannel() {
    this.showChannelForm = true;
  }

  /**
   * Handles channel selection and emits the selected channel ID.
   * 
   * @param channelId - The ID of the selected channel
   */
  onChannelClick(channelId: string) {
    console.log('Channel selected:', channelId);
    this.channelSelected.emit(channelId);
  }

  /**
   * Handles direct message selection.
   * 
   * @param userId - The ID of the user for the direct message
   */
  onDirectMessageClick(userId: string) {
    console.log('DM clicked:', userId);
  }

  /**
   * Handles workspace edit action.
   */
  onEditWorkspace() {
    console.log('Edit workspace clicked');
  }

  /**
   * Closes the channel creation form.
   */
  closeChannelForm() {
    this.showChannelForm = false;
  }
}