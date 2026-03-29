@echo off
REM Setup script for Dating App

echo.
echo Setting up Dating App...
echo.

cd /d "%~dp0CST2550Project"

echo Installing dependencies...
dotnet restore
echo.

echo Creating database...
dotnet ef migrations add InitialCreate --force 2>nul || (exit /b 0)
dotnet ef database update
echo.

echo Starting server...
echo App will be available at https://localhost:5001
echo Press Ctrl+C to stop
echo.

dotnet run
pause
