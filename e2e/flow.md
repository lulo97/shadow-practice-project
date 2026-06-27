http://localhost:3001/login

find id="username" 

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





