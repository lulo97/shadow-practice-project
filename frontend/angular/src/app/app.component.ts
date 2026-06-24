import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { callApi } from "../utils/apiUtils";
import { ModalComponent } from "../components/modal/modal.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ModalComponent],
  template: "<router-outlet /><app-modal />",
})
export class AppComponent {
  title = "my-angular-app";

  ngOnInit() {
    callApi({
      endpoint: "/health",
      method: "GET",
    });

    callApi({
      endpoint: "api/auth/me",
      method: "GET",
      credentials: "include", //allow to send cookie from browser to server
    });
  }
}
