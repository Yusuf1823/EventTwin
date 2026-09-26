@echo off
echo =========================================================
echo   EVENTTWIN - HACKCELESTIAL 3.0 (by Ghost Protocol)
echo   Predict. Simulate. Optimize.
echo =========================================================
echo Starting Server on http://localhost:5000 ...
start "EventTwin Server" cmd /k "cd server && npm start"

echo Starting Client on http://localhost:3000 ...
start "EventTwin Client" cmd /k "cd client && npm run dev"

echo.
echo Application is launching! Open: http://localhost:3000
