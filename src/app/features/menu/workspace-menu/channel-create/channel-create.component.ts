import { Component, Output, EventEmitter, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgIf } from '@angular/common'
import { ChannelsFacadeService } from '../../../../core/facades/channels-facade.service'

@Component({
  selector: 'app-channel-create',
  imports: [FormsModule, NgIf],
  templateUrl: './channel-create.component.html',
  styleUrl: './channel-create.component.scss'
})
export class ChannelCreateComponent {
  @Output() close = new EventEmitter<void>()
  @Output() channelCreated = new EventEmitter<string>()

  private channelsFacade = inject(ChannelsFacadeService)

  name = ''
  description = ''
  isCreating = false

  async createChannel() {
    if (!this.name.trim() || this.isCreating) return

    this.isCreating = true
    
    try {
      await this.channelsFacade.createChannel(
        this.name.trim(),
        this.description.trim()
      )

      // Emit success event - parent will handle channel selection
      this.channelCreated.emit('channel-created')
      this.resetForm()
    } catch (error) {
      console.error('Failed to create channel:', error)
    } finally {
      this.isCreating = false
    }
  }

  onCancel() {
    this.resetForm()
    this.close.emit()
  }

  private resetForm() {
    this.name = ''
    this.description = ''
  }
}