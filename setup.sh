#!/bin/bash
# Setup script for Dating App

set -e

echo "Setting up Dating App..."
echo ""

cd "$(dirname "$0")/CST2550Project"

echo "Installing dependencies..."
dotnet restore
echo ""

echo "Creating database..."
dotnet ef migrations add InitialCreate --force 2>/dev/null || true
dotnet ef database update
echo ""

echo "Starting server..."
echo "App will be available at https://localhost:5001"
echo "Press Ctrl+C to stop"
echo ""

dotnet run
