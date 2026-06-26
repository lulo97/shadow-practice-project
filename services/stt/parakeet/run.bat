@echo off
setlocal

REM Always run from this .bat location
cd /d "%~dp0"

REM Activate virtual environment
call "c:\Users\ADMIN\Desktop\shadow-practice-project\services\stt\parakeet\.venv\Scripts\activate.bat"

REM Start server
python app.py --model assets\tdt_ctc-110m-f16.gguf --port 8082

pause