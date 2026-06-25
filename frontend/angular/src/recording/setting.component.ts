import { Component, inject, OnInit } from "@angular/core";
import { callApi } from "../utils/apiUtils";
import { messageUtils } from "../utils/messageUtils";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserSetting } from "./usersetting.interface";

interface SettingDatasource {
  sttProviders: string[];
  recordScreenUiStyles: string[];
  loopOptions: number[];
}

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="settings-container" *ngIf="setting">
      <div class="setting-row">
        <label>STT Provider</label>
        <select [(ngModel)]="setting.sttProviderKey">
          <option *ngFor="let p of datasource?.sttProviders" [value]="p">{{p}}</option>
        </select>
      </div>

      <div class="setting-row">
        <label>Volume</label>
        <input type="range" [(ngModel)]="setting.volume" min="0" max="100" />
        <span>{{ setting.volume }}%</span>
      </div>

      <div class="setting-row">
        <label>UI Style</label>
        <select [(ngModel)]="setting.recordScreenUiStyle">
          <option *ngFor="let s of datasource?.recordScreenUiStyles" [value]="s">{{s}}</option>
        </select>
      </div>

      <div class="setting-row">
        <label>Loop</label>
        <button (click)="setting.loop = setting.loop === 1 ? 0 : 1" [class.active]="setting.loop === 1">
          {{ setting.loop === 1 ? "ON" : "OFF" }}
        </button>
      </div>

      <div class="setting-row">
        <label>Video Width (%)</label>
        <input type="number" [(ngModel)]="setting.videoWidthSize" min="10" max="90" />
      </div>

      <button (click)="save()">Save Settings</button>
    </div>
  `,
  styles: [`
    .settings-container { display: flex; flex-direction: column; gap: 15px; padding: 10px; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; }
    button.active { background-color: #007bff; color: white; }
  `]
})
export class SettingComponent implements OnInit {
  setting: UserSetting | null = null;
  datasource: SettingDatasource | null = null;

  async ngOnInit() {
    // Fetch initial settings
    const settingRes = await callApi({ endpoint: "api/usersettings", credentials: "include", method: "GET" });
    // Fetch datasource for dropdowns
    const dsRes = await callApi({ endpoint: "api/usersettings/datasource", credentials: "include", method: "GET" });

    if (settingRes.success && dsRes.success) {
      this.setting = settingRes.data;
      this.datasource = dsRes.data;
    } else {
      messageUtils("Failed to load settings.");
    }
  }

  async save() {
    if (!this.setting) return;
    const result = await callApi({
      endpoint: "api/usersettings",
      method: "POST",
      body: this.setting,
      credentials: "include"
    });

    if (result.success) {
      messageUtils("Settings saved successfully!");
    } else {
      messageUtils(result.message || "Error saving settings.");
    }
  }
}