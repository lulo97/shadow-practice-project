1. User Alice go to application website on Chrome
App check no user session so redirect to /signup
Alice enter username = alice and password = 123, confirm pass = 123
Alice hit sign up button
App add new user to Users table and redirect Alice to /login page
Alice re-enter username and password
App redirect to homepage /

2. Alice add new video
Alice paste https://www.youtube.com/watch?v=12345 into add video modal
App using yt-dlp to fetch .mp4, title, description, english transcript (text, start, end) and store in database
- This is a long process so let a process bar animation running in UI
- Server start a job running in background so users can turn off app and open on next day to see this job is done (design more here)
Alice click into video just add with title = TedTalk video about cats!

3. Alice practice recording
Alice click into video and app redirect to /recording page
Video have 3 line transcript:
- A cat has 4 legs (00:00 -> 00:04)
- A cat eats mouse (00:05 -> 00:09)
- Cats are relative to tigers (00:10 -> 00:15)
Alice click play on first line and video play 00:00 -> 00:04
Alice listen carefully and read text on UI "A cat has 4 legs" and vietnamese translation "Một con mèo có 4 chân"
Alice click on record button and speak, Alice click on stop record button
App store .wav file on backend and do stt process and output:
- A cat has 4 leg
- Score = 90 (because Alice speak leg not legs)
Alice click on Mine button to hear her audio again

4. Alice navigates the "One Sentence" recording interface

After recording the first sentence ("A cat has 4 legs"), Alice clicks the Next ⏭ button.
The UI updates to show the second line: "A cat eats mouse" (00:05 -> 00:09).
Alice decides this sentence is too easy, so she clicks the ⏭ Skip button. The app updates the TranscriptLine record in the database for this line, setting skip = 1.
The app automatically moves her to the third sentence: "Cats are relative to tigers" (00:10 -> 00:15).

5. Alice changes her Global Settings

Alice finds the third sentence difficult to hear clearly. She clicks the Settings ⚙️ button in the top right of the recording screen.
The Settings modal (Screen 4) pops up.
She toggles Loop to ON so the video segment (00:10 -> 00:15) plays repeatedly without her having to click play each time.
She adjusts the Volume slider from 70% to 90%.
She decides she wants to see the context of the whole video, so she changes the UI Style from "One sentence" to "Multiple sentences".
She changes the STT Provider to a different model (e.g., from Whisper to another option fetched from SystemEnums).
She closes the modal. The app saves these changes to the UserSettings table (loop = 1, volume = 90, record_screen_ui_style = 'MULTIPLE_SENTENCE', stt_provider_key = 'NEW_MODEL_KEY').
She listen looped on sentence 1 for a while and decided she heard it clearly already. She click on stop button to stop play audio repeatedly. She also open setting and change loop to OFF.
She practice on sentence 1 with new model stt, app output new text listened and new score.

6. Alice experiences the "Multiple Sentence" (Transcription) layout

The UI instantly re-renders to the Multiple Sentence Style (Screen 5B).
Alice can now see a scrolling list of all transcriptions below/beside the video.
She looks at the Status Legend indicators next to each line:
Sentence 1 ("A cat has 4 legs") has a Green Checkmark (Recorded).
Sentence 2 ("A cat eats mouse") has a Skipped/Not Recorded icon.
Sentence 3 ("Cats are relative to tigers") has an empty circle (Not Recorded).
She clicks on Sentence 3 in the list. The video jumps to 00:10. She clicks Record, speaks, and stops. The app processes the audio using the newly selected stt_provider_key, saves a new entry in the Records table, and gives her a score of 100. The icon changes to a Green Checkmark.

7. Alice reviews her Dashboard and Progress

Alice clicks the <- Back button to return to the Dashboard (Screen 2).
In the "My Videos" list, she sees the "TedTalk video about cats!".
Because she recorded 2 sentences and skipped 1, the progress bar now shows 100%, and the status icon reflects that it is fully processed.
If she had only finished 1 out of 3, the progress bar would show 33% and display the blue "In Progress" striped icon.

8. Alice explores System Videos and Search Filters

Alice wants to practice more, but doesn't want to add a new YouTube link. She clicks the System Videos tab on the left sidebar.
The app queries the Videos table for user_id = -1 (the Admin) and displays a list of pre-curated, high-quality shadowing videos.
The list is very long, so Alice clicks the Filter icon (blue button next to the search bar).
The Search & Filter modal (Screen 3) opens. Alice wants a recently added video, so she uses the From and To date pickers (e.g., matching the created_at column) and clicks Apply.
The list filters down. She finds a video called "Advanced English Phrasal Verbs" and starts practicing it.

9. Alice leaves the app and returns later (Jump to Unfinished)

Alice practices a few sentences of the new System Video, logs out (via the Profile menu in the bottom left), and goes to sleep.
The next day, she navigates back to the app and logs in.
On her Dashboard, she sees the "Advanced English Phrasal Verbs" video has an orange clock icon (Unfinished status), indicating it was started but not completed.
She clicks the Jump to Unfinished button at the top right of the video list. The dashboard instantly filters to show only videos that are partially completed.
She clicks into the Phrasal Verbs video. Once inside the Multiple Sentence recording screen, she clicks the Jump to unrecorded button.
The UI automatically scrolls and highlights the exact TranscriptLine where she left off yesterday, allowing her to seamlessly continue her shadowing practice.