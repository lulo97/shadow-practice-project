import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { FormsModule } from "@angular/forms";
import { messageUtils } from "../utils/messageUtils";
import { getRandomTip } from "./quotes";

@Component({
  selector: "signup",
  standalone: true,
  imports: [FormsModule],
  template: `<div
    class="flex flex-col items-center justify-center min-h-screen bg-white p-4"
  >
    <div class="text-center mb-8">
      <div class="w-full flex justify-center items-center">
        <img src="/icon.svg" alt="Description of icon" class="w-32" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Shadowing Project</h1>
      <p class="text-gray-500 text-sm">
        {{ dailyTip }}
      </p>
    </div>

    <div class="w-full max-w-sm space-y-4">
      <div class="flex flex-col gap-1">
        <label for="username" class="text-sm font-semibold text-gray-700"
          >Username</label
        >
        <input
          [(ngModel)]="username"
          id="username"
          placeholder="Enter your username"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="password" class="text-sm font-semibold text-gray-700"
          >Password</label
        >
        <div class="relative">
          <input
            [(ngModel)]="password"
            id="password"
            type="password"
            placeholder="Enter your password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute right-3 top-2.5 text-gray-400"
            ><i class="fas fa-eye"></i
          ></span>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label
          for="confirm-password"
          class="text-sm font-semibold text-gray-700"
          >Confirm Password</label
        >
        <div class="relative">
          <input
            [(ngModel)]="confirm_password"
            id="confirm-password"
            type="password"
            placeholder="Confirm your password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute right-3 top-2.5 text-gray-400"
            ><i class="fas fa-eye"></i
          ></span>
        </div>
      </div>

      <button
        (click)="handleSignUp()"
        id="sign-up"
        class="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition duration-200 mt-2"
      >
        Sign Up
      </button>

      <div class="text-center text-sm text-gray-600 mt-4">
        Already have an account?
        <a href="/login" class="text-blue-600 font-semibold">Log in</a>
      </div>
    </div>
  </div>`,
})
export class SignUpComponent {
  //alice 4i5x,p^K96a5
  username = "";
  password = "";
  confirm_password = "";
  dailyTip: string = "";

  ngOnInit() {
    this.dailyTip = getRandomTip();
  }

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
