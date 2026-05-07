@echo off
cd /d "C:\Users\betha\OneDrive\Documents\GitHub\Grant-Compass"
if exist .git\index.lock del /f .git\index.lock
git add GoForth.jsx api/analyze-funder.js api/search-funders.js
git commit -m "v5.3: premium UI redesign (warm ivory + charcoal), mobile bottom nav + hamburger, remove emoji from Analyze, broader funder search, social media scraping"
git push origin main
echo Done! Vercel deploying...
pause
