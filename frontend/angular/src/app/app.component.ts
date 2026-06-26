import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { callApi } from "../utils/apiUtils";
import { ModalComponent } from "../components/modal/modal.component";
import { messageUtils } from "../utils/messageUtils";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ModalComponent],
  template: "<router-outlet /><app-modal />",
})
export class AppComponent {
  title = "my-angular-app";

  async ngOnInit() {
    try {
      await callApi({
        endpoint: "/health",
        method: "GET",
      });
    } catch (error) {
      messageUtils("Backend not connected");
      throw error;
    }

    const currentPath = window.location.pathname;

    const publicRoutes = ["/login", "/signup"];

    if (!publicRoutes.includes(currentPath)) {
      const result_me = await callApi({
        endpoint: "api/auth/me",
        method: "GET",
        credentials: "include", //allow to send cookie from browser to server
      });

      if (!result_me.success) {
        messageUtils(result_me.message);
        window.location.href = "/login";
      }
    }
  }
}
