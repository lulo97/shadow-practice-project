import { Component } from "@angular/core";

@Component({
  standalone: true,
  template: `<div>
    <div>
      <label>Youtube Link</label> <input id="ytb-link" />
    </div>
    <div>
      <button id="add-btn">Add</button>
    </div>
  </div>`,
})
export class AddVideoComponent {}
