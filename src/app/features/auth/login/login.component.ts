import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChannelFormComponent } from "../../channels/channel-form/channel-form.component";
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ChannelFormComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  auth = inject(AuthService);

  email: string = '';
  pwd: string = '';

  login() {
    this.auth.signIn(this.email, this.pwd);
  }
}
