import { Component, Output, EventEmitter, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service'

@Component({
  selector: 'app-channel-create',
  imports: [FormsModule],
  templateUrl: './channel-create.component.html',
  styleUrl: './channel-create.component.scss'
})
export class ChannelCreateComponent {
  @Output() close = new EventEmitter<void>()
  @Output() channelCreated = new EventEmitter<string>()

  private channelsFacade = inject(ChannelsFacadeService)

  // Form-Felder für Channel-Erstellung
  name = ''
  description = ''
  isCreating = false

  /**
   * Erstellt einen neuen Channel mit Name und Beschreibung
   */
  async createChannel() {
    if (!this.name.trim() || this.isCreating) return

    this.isCreating = true
    
    try {
      // Channel über Facade-Service erstellen
      await this.channelsFacade.createChannel(
        this.name.trim(),
        this.description.trim()
      )

      // Erfolgs-Event an Parent-Component senden
      this.channelCreated.emit('channel-created')
      this.resetForm()
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error)
    } finally {
      this.isCreating = false
    }
  }

  /**
   * Bricht Channel-Erstellung ab und schließt Dialog
   */
  onCancel() {
    this.resetForm()
    this.close.emit()
  }

  /**
   * Setzt alle Form-Felder zurück
   */
  private resetForm() {
    this.name = ''
    this.description = ''
  }
}