## The Master 100% App Flow: Alice's Journey

### Step 1: Account Creation & Authentication

* **Actions:** Alice visits the website on Chrome. Finding no active session, the app redirects her to `/signup`.
* **Flow Details:** She inputs her username (`alice`), password (`123`), and confirms it. Noting your design choice, there is **no "Forgot Password" feature** to keep the core scope lean.
* **Database Action:** She clicks **Sign Up**. The app creates a row in the `Users` table and routes her to `/login`, where she re-enters her credentials to hit the homepage `/`.

### Step 2: Video Addition & Background Job Processing

* **Actions:** Alice clicks **+ Add Video** on the Dashboard sidebar. A modal opens with a single "YouTube Link" input field. She pastes her link and clicks **Add**.
* **Flow Details:** The UI instantly starts a progress bar animation on My Video content (new video row is added but nothing but a loading animation, click into this will show a modal with step by step process on server - can be success/failed on each step). In the background, the server triggers a asynchronous `yt-dlp` job to pull the video file, metadata, and English subtitles. (if video don't have english subtitle, using ASR model to process, this make whole process longer)
* **State Check:** Alice can completely close her browser tab right now. The next day, she returns, logs in, and sees the video successfully fully-processed on her dashboard with the title **"TedTalk video about cats!"**.

### Step 3: Resolving Missing Content via the Translation Modal

* **Actions:** Alice clicks into the cat video. Because this is a user-uploaded video, the Vietnamese translation is initially missing (`vi_text` is null). Alice sees this and clicks the **+ Translation** button in the header.
* **Flow Details:** The **Translation Modal** appears, showing a split layout: left side is a read-only view of the English transcript lines; the right side is an editable textarea block for the Vietnamese translation.
* **Feature Execution:** Alice wants to move quickly, so she has two choices:
1. She can click **Copy + Prompt** to instantly copy the English script bundled with a pre-written system prompt to her clipboard, ready to slice through ChatGPT in another window. (User do manually copy paste on ChatGPT here)
2. Instead, she clicks **Auto translation** to let the server's local LLM translate it inline.


* **Verification & Saving:** Once the text populates the right textarea, Alice clicks **Verify**. The app runs a background data validation check to confirm line counts match up perfectly with timestamps. She clicks **Save**, writing the text to the `vi_text` columns in the `TranscriptLine` table, and the modal closes.

### Step 4: Shadowing Practice (One-Sentence UI Focus)

* **Actions:** Alice begins practicing in the **One Sentence Style** layout.
* **Flow Details:** * She selects Sentence 1/100: *"A cat has 4 legs"*. She hits **Play** to listen, then reads the dual English and Vietnamese text sub-header context.
* She clicks **Record**, speaks into her microphone, and hits stop. The system parses her audio using her current STT provider, stores a `.wav` file, updates the `Records` table, and displays a score of **90** (because she said *"leg"* instead of *"legs"*).
* She clicks **Mine record ▶** to hear her own voice played back. The app plays her *newest* capture (all audio saves are cumulative and add-only; nothing gets overwritten or deleted).



### Step 5: Viewing Performance History & Re-Recording

* **Actions:** Curious about her improvements, Alice clicks the **Hamburger/List icon (≡)** next to the audio playback bar.
* **Flow Details:** This expands the **Recording History** section right below her console workspace. She sees a data table detailing all historical attempts for this specific sentence line with 5 explicit tracks: `No.`, `Created at`, `Heard text`, `Score`, and `STT Model Key`.
* **State Update:** She decides to switch things up. She opens **Settings (⚙️)**, changes the **STT Provider** to an alternate backend system enum, and turns **Loop** to **ON**.
* She hits record again. The audio continuously loops individual segments so she can listen deeply without manual resets. Her second attempt scores a **100**. The main UI screen dynamically adjusts to **always display the newest record attempt status**, showing a bright Green Checkmark. She turns Loop back to **OFF**.

### Step 6: Navigation Controls & Skipping Sentences

* **Actions:** Alice clicks **Next ⏭** to go to Sentence 2: *"A cat eats mouse"*.
* **Flow Details:** Finding this sentence much too trivial to waste time on, she hits the **Record / Skip** toggle button. This updates the current `TranscriptLine` record in the database directly, setting `skip = 1`.
* The system tracks this status seamlessly and skips her straight over to Sentence 3: *"Cats are relative to tigers"*. She reads the line but decides to click **⏮ Prev** to quickly double-check her pronunciation on Sentence 2 before moving forward.

### Step 7: Transitioning to the Multi-Sentence Dashboard Context

* **Actions:** To grasp the whole video context globally, Alice opens her **Settings** overlay again and switches the UI Style variable to **"Multiple sentences"**.
* **Flow Details:** The layout updates into a unified scrolling timeline grid (Transcription view). She tracks her progress status via the visual **Status Legend** indicators printed next to each line item card:
* *Sentence 1:* Displayed with a **Green Checkmark** (Recorded and scored).
* *Sentence 2:* Displayed with an **Unrecorded / Skipped** status indicator.
* *Sentence 3:* Displayed with a blank circle (Not recorded yet).


* Alice scrolls down the interface manually, clicks directly on the third line block to sync the video timestamp marker directly to `00:10`, and records her voice file.

### Step 8: System Library Exploration & Complex Search Filtering

* **Actions:** Alice returns to her core workspace dashboard via the **<- Back** button. Wanting fresh practice material without pasting links, she switches left-hand views to the **System Videos** library tab.
* **Flow Details:** The system runs a selective pull query against the database filtering purely for videos where `user_id = -1` (the Admin account containing vetted, curated content).
* **Filter Manipulation:** Because the catalog list is long, she uses the top **Search by title...** search bar to query words, and clicks the filter adjustments settings button to select specific parameters using **From** and **To** date fields.
* She reviews her search results. To test a different set of dates, she hits the **Clear** button inside the search dropdown box to completely purge her parameters and start clean.

### Step 9: Workspace Resumption via Smart Jumps

* **Actions:** Alice logs out for the night. The next afternoon she fires up the page and completes a fresh login cycle.
* **Flow Details:** On her dashboard, unfinished videos are flagged with an orange clock icon (**Unfinished** status tracking).
* **Shortcut Navigation:** Alice uses the global dashboard **Jump to unfinished** layout button. The dashboard instantly isolates and snaps her viewport to focus directly on the nearest incomplete video file.
* She clicks inside it to enter the Transcription screen and immediately selects the internal layout tool button: **Jump to unrecorded**. The workspace text container viewport automatically scrolls down and targets the exact sentence item block where her active record streak stopped.

### Step 10: App Clean-Up Lifecycle (Video Deletion)

* **Actions:** After practicing for weeks, Alice decides to clean up her personalized workspace list.
* **Flow Details:** From her Dashboard "My Videos" menu view, she identifies an old clip she no longer uses. She navigates to the right side of the video item card and clicks the small **Delete video button (X)**.
* **Database Purge:** The UI acts defensively, interrupting her action by rendering an **alert confirmation pop-up window**. Alice clicks confirm. The application executes a database cascade delete, dropping the target video record along with all corresponding dependencies inside the `TranscriptLine` and `Records` tables. The card smoothly unmounts from her dashboard view.