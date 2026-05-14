@echo off
cd /d "C:\Users\betha\OneDrive\Documents\GitHub\Grant-Compass"
echo Checking if index.lock exists...
if exist .git\index.lock del /f .git\index.lock
echo Using GitHub Desktop bundled git with credentials...
set GIT_EXE="C:\Users\betha\AppData\Local\GitHubDesktop\app-3.4.15\resources\app\git\cmd\git.exe"
if exist %GIT_EXE% (
    echo Found GitHub Desktop bundled git
    %GIT_EXE% push origin main
) else (
    echo GitHub Desktop git not found at expected path, trying system git...
    "C:\Program Files\Git\bin\git.exe" push origin main
)
echo Push complete!
pause
