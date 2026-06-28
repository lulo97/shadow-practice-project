import { Component } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { FormsModule } from "@angular/forms";
import { messageUtils } from "../utils/messageUtils";

@Component({
  selector: "login",
  standalone: true,
  imports: [FormsModule],
template: `
<div class="flex flex-col items-center justify-center min-h-screen bg-[#F4F3EF] text-[#1A1A1A] font-mono p-4 antialiased selection:bg-[#FFDE4D] relative">
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>

  <div class="w-full max-w-sm p-6 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] relative z-10">
    
    <div class="flex flex-col items-center mb-8">
      <div class="w-full flex justify-center items-center mb-4">
        <img src="/icon.svg" alt="Description of icon" class="w-24 border-2 border-black p-2 bg-white shadow-[4px_4px_0px_0px_#000]" />
      </div>
      
      <div class="inline-block bg-[#FFDE4D] text-black px-3 py-1 text-xs font-black border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] mb-3">
        System_Access
      </div>
      
      <h1 class="text-xl font-black uppercase tracking-tight text-gray-900">// Shadowing Project</h1>
      <p class="text-xs font-bold text-gray-500 mt-2">// Welcome back! Please sign in to continue.</p>
    </div>

    <div class="space-y-6">
      <div>
        <label class="block font-black text-xs uppercase mb-2">Registry_Key [Username]</label>
        <input
          [(ngModel)]="username"
          id="username"
          type="text"
          placeholder="Enter your username"
          class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
        />
      </div>

      <div>
        <label class="block font-black text-xs uppercase mb-2">Access_Token [Password]</label>
        <div class="relative">
          <input
            [(ngModel)]="password"
            id="password"
            type="password"
            placeholder="Enter your password"
            class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
          />
          <span class="absolute right-3 top-3.5 text-black cursor-pointer bg-white border border-black px-1 text-xs font-bold shadow-[1px_1px_0px_0px_#000] hover:bg-gray-100">
            <i class="fas fa-eye text-xs"></i>
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between py-1">
        <label class="flex items-center text-xs font-bold uppercase cursor-pointer select-none">
          <input 
            type="checkbox" 
            class="mr-2 w-4 h-4 rounded-none border-2 border-black bg-white checked:bg-[#2FD673] text-black focus:ring-0 appearance-none border-solid checked:after:content-['✓'] checked:after:block checked:after:text-center checked:after:text-xs checked:after:font-black" 
          />
          Remember_Device
        </label>
      </div>

      <div class="flex flex-col gap-3 pt-2">
        <button
          (click)="handleLogin()"
          id="log-in"
          class="w-full px-6 py-3 font-black uppercase tracking-wider bg-[#FFDE4D] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer text-sm"
        >
          Execute_Sign_In &rarr;
        </button>
      </div>
    </div>

    <p class="text-center text-xs font-bold text-gray-600 mt-8 pt-4 border-t-2 border-dashed border-black">
      No account yet?
      <button 
        (click)="handleSignUp()" 
        id="sign-up" 
        class="text-blue-600 font-black uppercase hover:underline ml-1 cursor-pointer"
      >
        [ Register_New ]
      </button>
    </p>
  </div>
</div>`
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
