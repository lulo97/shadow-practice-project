import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { FormsModule } from "@angular/forms";
import { messageUtils } from "../utils/messageUtils";

@Component({
  selector: "signup",
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
      <label>Confirm Password</label>
      <input
        [(ngModel)]="confirm_password"
        id="confirm-password"
        type="password"
      />
    </div>

    <div>
      <button (click)="handleSignUp()" id="sign-up">Sign Up</button>
    </div>
  </div>`,
})
export class SignUpComponent {
  //alice 4i5x,p^K96a5
  username = "";
  password = "";
  confirm_password = "";

  async handleSignUp() {
    if (!this.username) {
      messageUtils("username null!");
      return;
    }

    if (!this.password) {
      messageUtils("password null!");
      return;
    }

    if (!this.confirm_password) {
      messageUtils("confirm password null!");
      return;
    }

    if (this.password.length !== 12) {
      messageUtils("Password must be exactly 12 characters long.");
      return;
    }

    const hasLower = /[a-z]/.test(this.password);
    const hasUpper = /[A-Z]/.test(this.password);
    const hasNumber = /\d/.test(this.password);
    const hasSpecial = /[!@#$%^&*()]/.test(this.password);

    if (!hasLower) {
      messageUtils("Password must contain at least one lowercase letter.");
      return;
    }
    if (!hasUpper) {
      messageUtils("Password must contain at least one uppercase letter.");
      return;
    }
    if (!hasNumber) {
      messageUtils("Password must contain at least one number.");
      return;
    }
    if (!hasSpecial) {
      messageUtils("Password must contain at least one special character.");
      return;
    }

    if (this.password !== this.confirm_password) {
      messageUtils("Passwords do not match!");
      return;
    }
    const result = await callApi({
      endpoint: "api/auth/signup",
      body: {
        username: this.username,
        password: this.password,
      },
      method: "POST",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    } else {
      window.location.href = "/login";
    }
  }
}
