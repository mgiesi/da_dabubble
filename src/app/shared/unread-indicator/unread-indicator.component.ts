import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unread-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unread-indicator.component.html',
  styleUrl: './unread-indicator.component.scss'
})
export class UnreadIndicatorComponent {
  @Input() count: number = 0;
}