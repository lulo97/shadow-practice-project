import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ModalService } from "../components/modal/modal.service";

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="w-full font-mono text-[#1A1A1A] bg-white">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div class="flex flex-col">
          <label
            for="fromDate"
            class="block font-black text-xs uppercase mb-2 tracking-wider"
          >
            // REGISTRY_START [FROM]
          </label>
          <input
            type="date"
            id="fromDate"
            [(ngModel)]="fromDate"
            class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors text-sm uppercase"
          />
        </div>

        <div class="flex flex-col">
          <label
            for="toDate"
            class="block font-black text-xs uppercase mb-2 tracking-wider"
          >
            // REGISTRY_TERMINUS [TO]
          </label>
          <input
            type="date"
            id="toDate"
            [(ngModel)]="toDate"
            class="w-full p-3 border-2 border-black bg-[#F4F3EF] focus:bg-white font-bold outline-none focus:ring-2 focus:ring-[#FFDE4D] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-colors text-sm uppercase"
          />
        </div>
      </div>

      <div
        class="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t-2 border-black bg-white"
      >
        <button
          (click)="clearFilters()"
          class="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          Clear_Matrix
        </button>
        <button
          (click)="applyFilters()"
          class="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-[#FFDE4D] border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
        >
          Apply_Filters &rarr;
        </button>
      </div>
    </div>
  `,
})
export class FilterComponent {
  modal = inject(ModalService);

  fromDate: string = this.modal.config().data.fromDate;
  toDate: string = this.modal.config().data.toDate;
  ngOnInit() {
    this.modal.ready();
  }
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
