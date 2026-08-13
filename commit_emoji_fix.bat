@echo off
cd /d "C:\Users\betha\OneDrive\Documents\GitHub\Grant-Compass"
if exist .git\index.lock del /f .git\index.lock
git add GoForth.jsx
git commit -m "v5.4: warm ivory UI, dark charcoal sidebar, mobile nav, clickable contact links, Help tab, gold save button, sources panel"
git push origin main
echo Done! Vercel deploying...
pause
