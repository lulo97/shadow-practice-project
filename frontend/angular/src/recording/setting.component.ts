import { Component, inject, OnInit } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserSetting } from "./usersetting.interface";
import { ModalService } from "../components/modal/modal.service";

interface SettingDatasource {
  sttProviders: string[];
  loopOptions: number[];
}

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="settings-container" *ngIf="setting">
      <!-- STT Provider -->
      <div
        class="grid grid-cols-2 gap-4 items-center py-3 border-b border-gray-200"
      >
        <label class="font-bold text-gray-700">STT Provider</label>
        <select
          [(ngModel)]="setting.sttProviderKey"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option *ngFor="let p of datasource?.sttProviders" [value]="p">
            {{ p }}
          </option>
        </select>
      </div>

      <!-- Volume -->
      <div
        class="grid grid-cols-2 gap-4 items-center py-3 border-b border-gray-200"
      >
        <label class="font-bold text-gray-700">Volume</label>
        <div class="flex items-center gap-3">
          <input
            type="range"
            [(ngModel)]="setting.volume"
            min="0"
            max="100"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span class="text-sm font-medium text-gray-600 min-w-[3rem]"
            >{{ setting.volume }}%</span
          >
        </div>
      </div>

      <!-- Loop -->
      <div
        class="grid grid-cols-2 gap-4 items-center py-3 border-b border-gray-200"
      >
        <label class="font-bold text-gray-700">Loop</label>
        <button
          (click)="setting.loop = setting.loop === 1 ? 0 : 1"
          [class.active]="setting.loop === 1"
          class="px-6 py-2 rounded-md font-medium transition-colors duration-200"
          [ngClass]="{
            'bg-blue-600 text-white hover:bg-blue-700': setting.loop === 1,
            'bg-gray-200 text-gray-700 hover:bg-gray-300': setting.loop !== 1,
          }"
        >
          {{ setting.loop === 1 ? "ON" : "OFF" }}
        </button>
      </div>

      <!-- Video Width -->
      <div
        class="grid grid-cols-2 gap-4 items-center py-3 border-b border-gray-200"
      >
        <label class="font-bold text-gray-700">Video Width (%)</label>
        <input
          type="number"
          [(ngModel)]="setting.videoWidthSize"
          min="10"
          max="90"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Save Button -->
      <div class="pt-4">
        <button
          (click)="save()"
          class="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Save Settings
        </button>
      </div>
    </div>
  `,
})
export class SettingComponent implements OnInit {
  setting: UserSetting | null = null;
  datasource: SettingDatasource | null = null;
  private modal = inject(ModalService);

  async ngOnInit() {
    // Fetch initial settings
    const settingRes = await callApi({
      endpoint: "api/usersettings",
      credentials: "include",
      method: "GET",
    });
    // Fetch datasource for dropdowns
    const dsRes = await callApi({
      endpoint: "api/usersettings/datasource",
      credentials: "include",
      method: "GET",
    });

    if (settingRes.success && dsRes.success) {
      this.setting = settingRes.data;
      this.datasource = dsRes.data;
    } else {
      messageUtils("Failed to load settings.");
    }

    this.modal.ready();
  }

  async save() {
    if (!this.setting) return;
    const result = await callApi({
      endpoint: "api/usersettings",
      method: "POST",
      body: this.setting,
      credentials: "include",
    });

    if (result.success) {
      messageUtils("Settings saved successfully!");
    } else {
      messageUtils(result.message || "Error saving settings.");
    }
  }
}
