import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ModalService } from "../components/modal/modal.service";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
  <div class="bg-white rounded-lg border-gray-200 w-full max-w-md">
    <!-- Date Inputs - 2 Column Layout -->
    <div class="grid grid-cols-2 gap-4 mb-4">
      <div class="flex flex-col">
        <label for="fromDate" class="text-sm font-medium text-gray-700 mb-1">From:</label>
        <input 
          type="date" 
          id="fromDate"
          [(ngModel)]="fromDate" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div class="flex flex-col">
        <label for="toDate" class="text-sm font-medium text-gray-700 mb-1">To:</label>
        <input 
          type="date" 
          id="toDate"
          [(ngModel)]="toDate" 
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>
    </div>

    <!-- Button Group -->
    <div class="flex gap-3 justify-end">
      <button 
        (click)="clearFilters()" 
        class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
      >
        Clear
      </button>
      <button 
        class="primary px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        (click)="applyFilters()"
      >
        Apply
      </button>
    </div>
  </div>
  `,

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
