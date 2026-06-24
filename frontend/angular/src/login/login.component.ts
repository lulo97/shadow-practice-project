import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { FormsModule } from "@angular/forms";
import { messageUtils } from "../utils/messageUtils";

@Component({
  selector: "login",
  standalone: true,
  imports: [FormsModule],
  template: `<div>
    <div>
      <label>Username</label>
      <input [(ngModel)]="username" id="username" />
    </div>
    <div>
      <label>Password</label>
      <input [(ngModel)]="password" id="password" type="password" />
    </div>

    <div>
      <button (click)="handleSignUp()" id="sign-up">Sign Up</button>
      <button (click)="handleLogin()" id="log-in">Log In</button>
    </div>
  </div>`,
})
export class LoginComponent {
    username = "";
  password = "";

  async handleLogin() {
    if (!this.username) {
        messageUtils("username null!");
        return;
    }

    if (!this.password) {
        messageUtils("password null!");
        return;
    }

    const result = await callApi({
        endpoint: "api/auth/login",
        body: {
            username: this.username,
            password: this.password
        },
        method: "POST",
        credentials: "include"
    });

    if (!result.success) {
        messageUtils(result.message)
        return;
    } else {
        window.location.href = '/'
    }
  }

  handleSignUp() {
    window.location.href = '/signup'
  }
}
