import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { FormsModule } from "@angular/forms";
import { messageUtils } from "../utils/messageUtils";

@Component({
  selector: "login",
  standalone: true,
  imports: [FormsModule],
  template: `<div class="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
  <div class="w-full max-w-sm px-6">
    <div class="flex flex-col items-center mb-8">
      <div class="w-full flex justify-center items-center">
        <img src="/icon.svg" alt="Description of icon" class="w-32" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Shadowing Project</h1>
      <p class="text-gray-500 mt-2">Welcome back! Please sign in to continue.</p>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
        <input
          [(ngModel)]="username"
          id="username"
          type="text"
          placeholder="Enter your username"
          class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
        <div class="relative">
          <input
            [(ngModel)]="password"
            id="password"
            type="password"
            placeholder="Enter your password"
            class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="absolute right-3 top-3 text-gray-400 cursor-pointer">
            <i class="fas fa-eye"></i>
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between py-2">
        <label class="flex items-center text-sm text-gray-600">
          <input type="checkbox" class="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Remember me
        </label>
      </div>

      <div class="flex flex-col gap-3">
        <button
          (click)="handleLogin()"
          id="log-in"
          class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>

    <p class="text-center text-sm text-gray-600 mt-6">
      No account yet?
      <button (click)="handleSignUp()" id="sign-up" class="text-blue-600 font-semibold hover:underline">
        Sign Up
      </button>
    </p>
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
        password: this.password,
      },
      method: "POST",
      credentials: "include",
    });

    if (!result.success) {
      messageUtils(result.message);
      return;
    } else {
      window.location.href = "/";
    }
  }

  handleSignUp() {
    window.location.href = "/signup";
  }
}
