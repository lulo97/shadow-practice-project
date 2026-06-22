import { test, expect } from "@playwright/test";
import { BASE_URL } from "./utils/utils";

test.describe("Videos Controller API Tests", () => {
  test("should successfully accept, download, and store a video (Happy Path)", async ({
    request,
  }) => {
    const payload = {
      link: "https://www.youtube.com/watch?v=1aA1WGON49E",
    };

    // Act: Send POST request to the API
    const response = await request.post(`${BASE_URL}/v1/videos`, {
      data: payload,
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status()).toBe(200);
  });
});
