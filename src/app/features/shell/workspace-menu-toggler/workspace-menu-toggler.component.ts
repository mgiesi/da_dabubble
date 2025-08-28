import { Component, input, output } from '@angular/core'
import { NgClass } from '@angular/common'

@Component({
  selector: 'app-workspace-menu-toggler',
  standalone: true,
  imports: [NgClass],
  templateUrl: './workspace-menu-toggler.component.html',
  styleUrl: './workspace-menu-toggler.component.scss'
})
export class WorkspaceMenuTogglerComponent {
  isOpen = input<boolean>(false)
  toggle = output<void>()

  /**
   * Handles click event to toggle workspace menu visibility.
   * Emits toggle event to parent component.
   */
  onToggle() {
    this.toggle.emit()
  }
}