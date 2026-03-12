import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

constructor( private auth: AuthService) {}

email = '';
password = '';

register() {
  const user = { id : 1, email : this.email, password: this.password};

  
}

}
