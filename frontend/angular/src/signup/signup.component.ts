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
    class="flex flex-col items-center justify-center min-h-screen bg-[#F4F3EF] text-[#1A1A1A] font-mono p-4 antialiased selection:bg-[#FFDE4D] relative"
  >
    <div
      class="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"
    ></div>

    <div
      class="w-[50vw] p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] relative z-10"
    >
      <div class="flex flex-col items-center mb-8">
        <div class="w-full flex justify-center items-center mb-4">
          <img
            src="/icon.svg"
            alt="Description of icon"
            class="w-24 border-2 border-black p-2 bg-white shadow-[4px_4px_0px_0px_#000]"
          />
        </div>

        <div
          class="inline-block bg-[#00E5FF] text-black px-3 py-1 text-xs font-black border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] mb-3"
        >
          System_Register
        </div>

        <h1 class="text-xl font-black uppercase tracking-tight text-gray-900">
          // Shadowing Project
        </h1>
        <p class="text-xs font-bold text-gray-500 mt-2 text-center">
          // {{ dailyTip }}
        </p>
      </div>

      <div class="space-y-6">
        <div>
          <label for="username" class="block font-black text-xs uppercase mb-2"
            >Registry_Key [Username]</label
          >
          <input
            [(ngModel)]="username"
            id="username"
            type="text"
            placeholder="Enter your username"
            class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
          />
        </div>

        <div>
          <label for="password" class="block font-black text-xs uppercase mb-2"
            >Access_Token [Password]</label
          >
          <div class="relative">
            <input
              [(ngModel)]="password"
              id="password"
              type="password"
              placeholder="Enter your password"
              class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
            />
            <span
              class="absolute right-3 top-3.5 text-black cursor-pointer bg-white border border-black px-1 text-xs font-bold shadow-[1px_1px_0px_0px_#000] hover:bg-gray-100"
            >
              <i class="fas fa-eye text-xs"></i>
            </span>
          </div>
        </div>

        <div>
          <label
            for="confirm-password"
            class="block font-black text-xs uppercase mb-2"
            >Verify_Token [Confirm Password]</label
          >
          <div class="relative">
            <input
              [(ngModel)]="confirm_password"
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
            />
            <span
              class="absolute right-3 top-3.5 text-black cursor-pointer bg-white border border-black px-1 text-xs font-bold shadow-[1px_1px_0px_0px_#000] hover:bg-gray-100"
            >
              <i class="fas fa-eye text-xs"></i>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-3 pt-2">
          <button
            (click)="handleSignUp()"
            id="sign-up"
            class="w-full px-6 py-3 font-black uppercase tracking-wider bg-[#FFDE4D] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer text-sm"
          >
            Execute_Sign_Up &rarr;
          </button>
        </div>
      </div>

      <p
        class="text-center text-xs font-bold text-gray-600 mt-8 pt-4 border-t-2 border-dashed border-black"
      >
        Already have an account?
        <a
          href="/login"
          class="text-blue-600 font-black uppercase hover:underline ml-1 cursor-pointer"
        >
          [ Log_In ]
        </a>
      </p>
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
