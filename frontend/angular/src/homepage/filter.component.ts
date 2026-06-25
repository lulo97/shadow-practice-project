import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ModalService } from "../components/modal/modal.service";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="filter-container">
      <div class="input-group">
        <label>From:</label>
        <input type="date" [(ngModel)]="fromDate" />
      </div>

      <div class="input-group">
        <label>To:</label>
        <input type="date" [(ngModel)]="toDate" />
      </div>

      <div class="button-group">
        <button (click)="clearFilters()">Clear</button>
        <button class="primary" (click)="applyFilters()">Apply</button>
      </div>
    </div>
  `,
  styles: [
    `
      .filter-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        border: 1px solid #ccc;
        width: 250px;
      }
      .input-group {
        display: flex;
        flex-direction: column;
      }
      .button-group {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }
      .primary {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
      }
    `,
  ],
})
export class FilterComponent {
  modal = inject(ModalService);

  fromDate: string = this.modal.config().data.fromDate;
  toDate: string = this.modal.config().data.toDate;

  applyFilters() {
    // Append times to the ISO date string
    const formattedFrom = this.fromDate ? `${this.fromDate}T00:00:00` : null;
    const formattedTo = this.toDate ? `${this.toDate}T23:59:59` : null;

    console.log("Applying filters:", { from: formattedFrom, to: formattedTo });

    // Pass the formatted strings to your handler
    this.modal.config().data.handleFilter(formattedFrom, formattedTo);
    this.modal.close();
  }

  clearFilters() {
    this.fromDate = "";
    this.toDate = "";
    console.log("Filters cleared");
  }
}
