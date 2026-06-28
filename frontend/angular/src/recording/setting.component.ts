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
    <div id="settingsContainer" *ngIf="setting">
      <div
        id="sttProviderWrapper"
        class="space-y-2 pb-4 border-b-2 border-dashed border-black"
      >
        <label
          id="sttProviderLabel"
          class="block font-black text-sm uppercase tracking-wider text-[#1A1A1A]"
        >
          Registry_Key [STT Provider]
        </label>
        <div class="relative">
          <select
            id="sttProviderSelect"
            [(ngModel)]="setting.sttProviderKey"
            class="w-full p-3 border-2 border-black bg-white font-bold appearance-none rounded-none outline-none focus:bg-[#FFDE4D] transition-colors cursor-pointer"
          >
            <option
              id="sttProviderOption"
              *ngFor="let p of datasource?.sttProviders"
              [value]="p"
            >
              {{ p }}
            </option>
          </select>
          <div
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 font-black border-l-2 border-black bg-black text-white"
          >
            V
          </div>
        </div>
      </div>

      <div
        id="loopWrapper"
        class="grid grid-cols-2 gap-4 items-center py-4 border-b-2 border-dashed border-black"
      >
        <label
          id="loopLabel"
          class="font-black text-sm uppercase tracking-wider text-[#1A1A1A]"
        >
          Execution_Loop
        </label>
        <button
          id="loopToggleButton"
          (click)="setting.loop = setting.loop === 1 ? 0 : 1"
          [class.active]="setting.loop === 1"
          class="px-6 py-3 font-black uppercase tracking-wider border-2 border-black transition-all cursor-pointer text-center"
          [ngClass]="{
            'bg-[#2FD673] text-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000]':
              setting.loop === 1,
            'bg-[#F4F3EF] text-gray-500 shadow-[2px_2px_0px_0px_#000] hover:bg-gray-200':
              setting.loop !== 1,
          }"
        >
          {{ setting.loop === 1 ? "ON // ACTIVE" : "OFF // IDLE" }}
        </button>
      </div>

      <div
        id="videoWidthWrapper"
        class="space-y-2 pb-4 border-b-2 border-dashed border-black"
      >
        <label
          id="videoWidthLabel"
          class="block font-black text-sm uppercase tracking-wider text-[#1A1A1A]"
        >
          Matrix_Scale [Video Width %]
        </label>
        <input
          id="videoWidthInput"
          type="number"
          [(ngModel)]="setting.videoWidthSize"
          min="10"
          max="90"
          placeholder="50"
          class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors"
        />
      </div>

      <div id="saveButtonWrapper" class="pt-2">
        <button
          id="saveSettingsButton"
          (click)="save()"
          class="w-full px-6 py-4 font-black uppercase tracking-widest bg-[#FFDE4D] text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
        >
          Commit_Changes &rarr;
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
