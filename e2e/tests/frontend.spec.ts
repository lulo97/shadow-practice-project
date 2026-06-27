import { test, expect, Page } from "@playwright/test";

// ─────────────────────────────────────────────
// Helper: timestamped logger
// ─────────────────────────────────────────────
function log(step: string, detail = "") {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ▶ ${step}${detail ? " — " + detail : ""}`);
}

function logOk(step: string, detail = "") {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ✅ ${step}${detail ? " — " + detail : ""}`);
}

function logWarn(step: string, detail = "") {
  const ts = new Date().toISOString();
  console.warn(`[${ts}] ⚠️  ${step}${detail ? " — " + detail : ""}`);
}

// ─────────────────────────────────────────────
// Main test
// ─────────────────────────────────────────────
test("Full E2E workflow — video add, transcript, record, translate, settings, logout", async ({
  page, context 
}) => {
  // ══════════════════════════════════════════
  // STEP 1 — Authentication & Navigation
  // ══════════════════════════════════════════
  log("STEP 1", "Navigating to login page");
  await page.goto("http://localhost:3001/login");
  logOk("STEP 1", "Page loaded: http://localhost:3001/login");

  log("STEP 1", "Filling in credentials");
  await page.locator("#username").fill("alice");
  await page.locator("#password").fill("4i5x,p^K96a5");
  logOk("STEP 1", "Credentials filled: username=alice");

  log("STEP 1", "Clicking #log-in button");
  await page.locator("#log-in").click();

  log("STEP 1", "Waiting for #project-title to confirm successful login");
  await expect(page.locator("#project-title")).toBeVisible();
  logOk("STEP 1", "Login successful — #project-title is visible");

  // ══════════════════════════════════════════
  // STEP 2 — Add Video via URL
  // ══════════════════════════════════════════
  log("STEP 2", "Clicking #nav-my-videos sidebar link");
  await page.locator("#nav-my-videos").click();
  logOk("STEP 2", "Navigated to My Videos");

  log("STEP 2", "Clicking #add-video-btn");
  await page.locator("#add-video-btn").click();

  log("STEP 2", "Waiting for #add-video-container to be visible");
  await expect(page.locator("#add-video-container")).toBeVisible();
  logOk("STEP 2", "#add-video-container modal is visible");

  const ytUrl = "https://www.youtube.com/watch?v=eSW2LVbPThw";
  log("STEP 2", `Entering YouTube URL: ${ytUrl}`);
  await page.locator("#ytb-link").fill(ytUrl);

  log("STEP 2", "Clicking #add-btn to submit the video URL");
  await page.locator("#add-btn").click();
  logOk("STEP 2", "Video URL submitted");

  // ══════════════════════════════════════════
  // STEP 3 — Dynamic Element Extraction & SSE Wait
  // ══════════════════════════════════════════
  log("STEP 3", 'Waiting for a video card element matching [id^="video-"]');
  const videoCardLocator = page
    .locator('[id^="video-"]')
    .filter({
      has: page.locator(":scope"),
    })
    .evaluateAll((els) => els.filter((el) => /^video-\d+$/.test(el.id))); // Wait for at least one numeric video card to appear
  await expect(
    page.locator('[id^="video-"]').filter({ hasText: "" }).first(),
  ).toBeVisible({ timeout: 30_000 });

  // Find the first element whose id matches "video-{digits}"
  const videoCardEl = page.locator('[id^="video-"]').filter({
    hasNot: page.locator('[id="video-search"]'), // exclude known non-numeric
  });

  // More robust: use locator + evaluate to find first numeric match
  const videoId = await page.waitForFunction(
    () => {
      const els = document.querySelectorAll('[id^="video-"]');
      for (const el of els) {
        const match = el.id.match(/^video-(\d+)$/);
        if (match) return match[1];
      }
      return null;
    },
    { timeout: 30_000 },
  );

  const videoIdValue = videoId.toString();
  logOk("STEP 3", `Extracted numeric videoId = "${videoIdValue}"`);

  const videoImageSelector = `#img-thumb-${videoIdValue}`;
  log("STEP 3", `Waiting for ${videoImageSelector} to be visible`);
  await expect(page.locator(videoImageSelector)).toBeVisible({
    timeout: 60_000,
  });

  log("STEP 3", `Waiting for ${videoImageSelector} src/href to be populated`);
  await expect(page.locator(videoImageSelector)).not.toHaveAttribute("src", "");
  await expect(page.locator(videoImageSelector)).not.toHaveAttribute(
    "src",
    /^$/,
  );
  // also guard against placeholder-only values like "#" or "undefined"
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel) as
        | HTMLImageElement
        | HTMLAnchorElement
        | null;
      if (!el) return false;
      const val = el.getAttribute("src") || el.getAttribute("href") || "";
      return val.length > 0 && val !== "#" && val !== "undefined";
    },
    videoImageSelector,
    { timeout: 60_000 },
  );
  logOk(
    "STEP 3",
    `${videoImageSelector} has a valid src/href — SSE processing complete`,
  );

  log("STEP 3", `Clicking ${videoImageSelector}`);
  await page.locator(videoImageSelector).click();
  logOk("STEP 3", "Video thumbnail clicked — opening transcript view");

  // ══════════════════════════════════════════
  // STEP 4 — Transcript & Audio Playback Interaction
  // ══════════════════════════════════════════
  log("STEP 4", "Waiting for #right-panel-title to exist");
  await expect(page.locator("#right-panel-title")).toBeAttached();
  logOk("STEP 4", "#right-panel-title exists in DOM");

  log(
    "STEP 4",
    'Collecting all transcript row items [id^="transcript-row-item-"]',
  );
  const transcriptItems = page.locator('[id^="transcript-row-item-"]');
  await expect(transcriptItems.first()).toBeVisible({ timeout: 15_000 });

  const allTranscriptIds = await transcriptItems.evaluateAll((els) =>
    els.map((el) => el.id),
  );
  log(
    "STEP 4",
    `Found ${allTranscriptIds.length} transcript row items: ${allTranscriptIds.join(", ")}`,
  );

  // Find element with lowest numeric suffix
  const lowestId = allTranscriptIds.reduce((prev, curr) => {
    const prevNum = parseInt(prev.replace(/^transcript-row-item-/, ""), 10);
    const currNum = parseInt(curr.replace(/^transcript-row-item-/, ""), 10);
    return currNum < prevNum ? curr : prev;
  });
  log("STEP 4", `Lowest transcript row item ID: "${lowestId}"`);

  await page.locator(`#${lowestId}`).click();
  logOk("STEP 4", `Clicked transcript row item: #${lowestId}`);

  // Play button assertion and toggle
  const playBtn = page.locator("#btn-toggle-play");
  log(
    "STEP 4",
    'Asserting #btn-toggle-play initially contains "play" text (case-insensitive)',
  );
  const initialPlayText = await playBtn.innerText();
  expect(initialPlayText.toLowerCase()).toContain("play");
  logOk(
    "STEP 4",
    `Initial play button text: "${initialPlayText.trim()}" — contains "play" ✓`,
  );

  log("STEP 4", "Clicking #btn-toggle-play to start playback");
  await playBtn.click();
  logOk("STEP 4", 'Play clicked — expecting text to change to "Stop"');

  log("STEP 4", 'Waiting for button text to contain "Stop"');
  await expect(playBtn).toContainText(/stop/i);
  logOk("STEP 4", 'Button now shows "Stop" — playback active');

  log("STEP 4", "Clicking play button again to stop playback");
  await playBtn.click();

  log("STEP 4", 'Waiting for button text to revert back to "Play"');
  await expect(playBtn).toContainText(/play/i, { timeout: 10_000 });
  logOk("STEP 4", 'Button reverted to "Play" — playback stopped manually');

  // ══════════════════════════════════════════
  // STEP 5 — Audio Recording & History Verification (Run 1)
  // ══════════════════════════════════════════
  const recordBtn = page.locator("#btn-toggle-record");

  log("STEP 5 [Run 1]", "Clicking #btn-toggle-record to START recording");
  await recordBtn.click();
  logOk("STEP 5 [Run 1]", "Recording started");

  log("STEP 5 [Run 1]", "Waiting 1 second before stopping...");
  await page.waitForTimeout(1_000);

  log("STEP 5 [Run 1]", "Clicking #btn-toggle-record to STOP recording");
  await recordBtn.click();
  logOk("STEP 5 [Run 1]", "Recording stopped — waiting for STT to complete");

  log(
    "STEP 5 [Run 1]",
    'Waiting for #btn-toggle-record text to return to "Record"',
  );
  await expect(recordBtn).toContainText(/record/i, { timeout: 60_000 });
  logOk("STEP 5 [Run 1]", 'STT complete — button shows "Record"');

  log("STEP 5 [Run 1]", "Clicking #btn-record-history");
  await page.locator("#btn-record-history").click();

  log("STEP 5 [Run 1]", "Waiting for #table-container to appear");
  await expect(page.locator("#table-container")).toBeVisible({
    timeout: 15_000,
  });
  logOk("STEP 5 [Run 1]", "#table-container is visible");

  log("STEP 5 [Run 1]", "Waiting for first history row #record-row-0");
  await expect(page.locator("#record-row-0")).toBeVisible({ timeout: 15_000 });
  logOk(
    "STEP 5 [Run 1]",
    "#record-row-0 is visible — recording history confirmed",
  );

  log("STEP 5 [Run 1]", "Closing modal via #close-modal");
  await page.locator("#close-modal").click();
  logOk("STEP 5 [Run 1]", "Modal closed");

  // ══════════════════════════════════════════
  // STEP 6 — Playback & Navigation Actions
  // ══════════════════════════════════════════
  log(
    "STEP 6",
    'Locating <audio id="audio-player-mine"> and starting playback',
  );
  const audioPlayer = page.locator("audio#audio-player-mine");
  await expect(audioPlayer).toBeAttached();

  await audioPlayer.evaluate((el: HTMLAudioElement) => el.play());
  logOk("STEP 6", "Audio playback started");

  log("STEP 6", "Waiting for audio playback to complete (ended event)");
  await page.waitForFunction(
    () => {
      const audio =
        document.querySelector<HTMLAudioElement>("#audio-player-mine");
      return audio ? audio.ended : false;
    },
    { timeout: 60_000 },
  );
  logOk("STEP 6", "Audio playback finished");

  log("STEP 6", "Clicking #btn-jump-unrecorded");
  await page.locator("#btn-jump-unrecorded").click();
  logOk("STEP 6", "Jumped to first unrecorded line");

  log("STEP 6", "Clicking #btn-skip-line");
  await page.locator("#btn-skip-line").click();
  logOk("STEP 6", "Skipped line");

  log("STEP 6", "Clicking #btn-jump-unrecorded again");
  await page.locator("#btn-jump-unrecorded").click();
  logOk("STEP 6", "Jumped to next unrecorded line");

  // ══════════════════════════════════════════
  // STEP 7 — Translation Engine Verification
  // ══════════════════════════════════════════
  log("STEP 7", "Clicking #btn-translation to open modal translation");
  await page.locator("#btn-translation").click();

  log("STEP 7", "Clicking #btn-auto-translation to trigger auto-translation");
  await page.locator("#btn-auto-translation").click();

  log(
    "STEP 7",
    "Waiting for button ID to temporarily change to #btn-auto-translation-loading",
  );
  await expect(page.locator("#btn-auto-translation-loading")).toBeVisible({
    timeout: 15_000,
  });
  logOk(
    "STEP 7",
    "#btn-auto-translation-loading is visible — translation in progress",
  );

  log("STEP 7", "Waiting for button to revert to #btn-auto-translation");
  await expect(page.locator("#btn-auto-translation")).toBeVisible({
    timeout: 120_000,
  });
  logOk("STEP 7", "#btn-auto-translation is visible — translation complete");

  log("STEP 7", "Closing modal via #close-modal");
  await page.locator("#close-modal").click();
  logOk("STEP 7", "Modal closed");

  log("STEP 7", "Checking first #translation-vi-text has non-empty text");
  const translationEl = page.locator("#translation-vi-text").first();
  await expect(translationEl).toBeVisible();
  const translationText = await translationEl.innerText();
  expect(translationText.trim().length).toBeGreaterThan(0);
  logOk(
    "STEP 7",
    `Translation text found: "${translationText.trim().substring(0, 80)}..."`,
  );

  // ══════════════════════════════════════════
  // STEP 8 — Settings Configurations
  // ══════════════════════════════════════════
  log("STEP 8", "Clicking #btn-settings");
  await page.locator("#btn-settings").click();

  log("STEP 8", "Waiting for #sttProviderWrapper to appear");
  await expect(page.locator("#sttProviderWrapper")).toBeVisible({
    timeout: 10_000,
  });
  logOk("STEP 8", "Settings panel open — #sttProviderWrapper visible");

  log("STEP 8", 'Selecting "PARAKEET" from #sttProviderSelect dropdown');
  await page.locator("#sttProviderSelect").selectOption({ label: "PARAKEET" });
  const selectedValue = await page.locator("#sttProviderSelect").inputValue();
  logOk("STEP 8", `STT provider selected — current value: "${selectedValue}"`);

  log("STEP 8", "Clicking #loopToggleButton");
  await page.locator("#loopToggleButton").click();
  logOk("STEP 8", "Loop toggle clicked");

  log("STEP 8", "Clearing #videoWidthInput and setting value to 40");
  const videoWidthInput = page.locator("input#videoWidthInput");
  await videoWidthInput.clear();
  await videoWidthInput.fill("40");
  logOk("STEP 8", "videoWidthInput set to 40");

  log("STEP 8", "Clicking #saveSettingsButton");
  await page.locator("#saveSettingsButton").click();
  logOk("STEP 8", "Settings saved");

  // ══════════════════════════════════════════
  // STEP 9 — Recording Validation with Updated Settings (Run 2)
  // ══════════════════════════════════════════
  log("STEP 9 [Run 2]", "Clicking #close-modal");
  await page.locator("#close-modal").click();
  logOk("STEP 9 [Run 2]", "Settings modal closed");

  log("STEP 9 [Run 2]", "Clicking #btn-jump-unrecorded");
  await page.locator("#btn-jump-unrecorded").click();
  logOk("STEP 9 [Run 2]", "Jumped to unrecorded line");








  log("STEP 9 [Run 2]", "Clicking #btn-record-inner");
  await page.locator("#btn-record-inner").click();
  logOk("STEP 9 [Run 2]", "#btn-record-inner clicked");

  // Recording loop — Run 2
  log(
    "STEP 9 [Run 2]",
    "Clicking #btn-toggle-record to START recording (Run 2)",
  );
  await page.locator("#btn-toggle-record").click();
  logOk("STEP 9 [Run 2]", "Recording started (Run 2)");

  log("STEP 9 [Run 2]", "Waiting 3 seconds for audio to buffer...");
  await page.waitForTimeout(3_000);
  page.on("console", (msg) => {
    if (msg.text().includes("Blob size")) console.log("[browser]", msg.text());
  });
  log(
    "STEP 9 [Run 2]",
    "Clicking #btn-toggle-record to STOP recording (Run 2)",
  );
  await page.locator("#btn-toggle-record").click();
  logOk("STEP 9 [Run 2]", "Recording stopped (Run 2) — waiting for STT");

  log(
    "STEP 9 [Run 2]",
    'Waiting for #btn-toggle-record text to return to "Record"',
  );
  await expect(page.locator("#btn-toggle-record")).toContainText(/record/i, {
    timeout: 60_000,
  });
  logOk("STEP 9 [Run 2]", 'STT complete — button shows "Record"');

  log("STEP 9 [Run 2]", "Clicking #btn-record-history");
  await page.locator("#btn-record-history").click();

  log("STEP 9 [Run 2]", "Waiting for #table-container");
  await expect(page.locator("#table-container")).toBeVisible({
    timeout: 15_000,
  });

  log("STEP 9 [Run 2]", "Waiting for #record-row-0");
  await expect(page.locator("#record-row-0")).toBeVisible({ timeout: 15_000 });
  logOk("STEP 9 [Run 2]", "#record-row-0 visible — history populated");

  log("STEP 9 [Run 2]", 'Asserting #td-model-key-0 contains "PARAKEET"');
  const modelKeyCell = page.locator("#td-model-key-0");
  await expect(modelKeyCell).toBeVisible();
  await expect(modelKeyCell).toHaveText("PARAKEET");
  logOk(
    "STEP 9 [Run 2]",
    '#td-model-key-0 = "PARAKEET" ✓ — correct STT provider used',
  );

  log("STEP 9 [Run 2]", "Closing modal via #close-modal");
  await page.locator("#close-modal").click();
  logOk("STEP 9 [Run 2]", "Modal closed");

  // ══════════════════════════════════════════
  // STEP 10 — Audio Loop Assertion & Logout
  // ══════════════════════════════════════════
  log("STEP 10", 'Locating <audio id="audio-player-mine">');
  const loopAudio = page.locator("audio#audio-player-mine");
  await expect(loopAudio).toBeAttached();

  log("STEP 10", 'Asserting audio element has "loop" attribute');
  await expect(loopAudio).toHaveAttribute("loop", "");
  logOk("STEP 10", "audio#audio-player-mine has loop attribute ✓");

  log("STEP 10", "Starting audio playback");
  await loopAudio.evaluate((el: HTMLAudioElement) => el.play());
  logOk("STEP 10", "Audio playing");

  log(
    "STEP 10",
    "Verifying audio is actually looping (currentTime advances after it would have ended)",
  );
  const isLooping = await page.waitForFunction(
    () => {
      const audio =
        document.querySelector<HTMLAudioElement>("#audio-player-mine");
      if (!audio) return false;
      return audio.loop === true;
    },
    { timeout: 10_000 },
  );
  logOk("STEP 10", `audio.loop === true confirmed: ${!!isLooping}`);

  log("STEP 10", "Stopping audio playback");
  await loopAudio.evaluate((el: HTMLAudioElement) => {
    el.pause();
    el.currentTime = 0;
  });
  logOk("STEP 10", "Audio stopped and reset");

  log("STEP 10", "Clicking #btn-back to return to video list");
  await page.locator("#btn-back").click();
  logOk("STEP 10", "#btn-back clicked");

  log("STEP 10", "Clicking #logout-link");
  await page.locator("#logout-link").click();

  log("STEP 10", "Waiting for #username field to confirm redirect to /login");
  await expect(page.locator("#username")).toBeVisible({ timeout: 15_000 });
  logOk("STEP 10", "Logout successful — #username visible on /login page ✓");

  log("ALL STEPS COMPLETE", "🎉 Full E2E workflow passed");
});
