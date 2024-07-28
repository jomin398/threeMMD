@echo off
start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --incognito --user-data-dir=C:\Temp\Chrome "file://%cd%/index.html"