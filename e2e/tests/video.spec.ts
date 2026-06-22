import { test, expect } from "@playwright/test";
import { BASE_URL } from "./utils/utils";

const VIDEO_ID = "1aA1WGON49E";
const VIDEO_LINK = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

let videoTitle: string;

test.describe.serial("Videos Controller API Tests", () => {
  test("should add video", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/v1/videos`, {
      data: { link: VIDEO_LINK },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(200);
  });

  test("should get video by id and extract title", async ({ request }) => {
    const metaResponse = await request.get(
      `${BASE_URL}/v1/videos/${VIDEO_ID}/metadata`,
    );
    expect(metaResponse.status()).toBe(200);

    const { title } = await metaResponse.json();
    expect(title).toBeTruthy();
    videoTitle = title;

    const videoResponse = await request.get(
      `${BASE_URL}/v1/videos/${VIDEO_ID}`,
    );
    expect(videoResponse.status()).toBe(200);
    expect(videoResponse.headers()["content-type"]).toContain("video/");
  });

  test("should return video in list when searching by title", async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}/v1/videos`, {
      params: { title: videoTitle },
    });

    expect(response.status()).toBe(200);

    const results = await response.json();
    expect(results.some((v: { id: string }) => v.id === VIDEO_ID)).toBe(true);
  });

  test("should delete video", async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/v1/videos/${VIDEO_ID}`);
    expect(response.status()).toBe(204);
  });

  test("should return 404 after deletion", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/videos/${VIDEO_ID}`);
    expect(response.status()).toBe(404);
  });
});
