http://localhost:3001/login

find html tag id="username" 

id="password"

fill info alice/4i5x,p^K96a5

find id="log-in" click

wait id="project-title" exist

click on id="nav-my-videos"

click on id="add-video-btn"

wait id="add-video-container" exist

input on id="ytb-link" youtube = https://www.youtube.com/watch?v=eSW2LVbPThw

click id="add-btn" button

wait [id]="'video-' + video.id" exist, video.id = number, extract this as videoId for later use

after job run done, backend send sse to frontend, wait id="video-title-id-1" exist (videoId = 1 for example) and click

wait id="right-panel-title" exist

find all tags with id = id="transcript-row-item-1" (item-1 have 1 = id of transcript line), make sure get the lowest transcript line id, click into this div

find id="btn-toggle-play" and click, text inside (<button><i>Play</i><button>) will like %Play% compare lowercase, after click it will turn into "Stop" and wait for it turn back to "Play"

find id="btn-toggle-record" and click, wait 1s and click again to stop record, after click stop backend run stt modal and wait for id="btn-toggle-record" have inner text = %Record% again

click in id="btn-record-history", 






