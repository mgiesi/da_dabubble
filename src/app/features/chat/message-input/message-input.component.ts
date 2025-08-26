import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Input } from '@angular/core';

@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss'
})
export class MessageInputComponent {
  messageText = '';
  @Input() placeholder: string = 'Nachricht schreiben...';

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSendMessage(event);
    }
  }

  onSendMessage(event?: KeyboardEvent) {
    if (event && event.shiftKey) {
      return;
    }
    
    if (event) {
      event.preventDefault();
    }
    
    if (this.messageText.trim()) {
      console.log('Sending message:', this.messageText);
      this.messageText = '';
    }
  }
}