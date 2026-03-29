# Quick Start Guide

Get the dating app running in minutes.

## Setup

### macOS/Linux

```bash
chmod +x setup.sh
./setup.sh
```

### Windows

```bash
setup.bat
```

This will:
1. Install dependencies
2. Create the database
3. Start the backend server

The app will be available at https://localhost:5001

### Manual Setup

If the setup scripts don't work:

```bash
cd CST2550Project
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

Then open https://localhost:5001

## Testing

1. Register a new account on the registration page
2. Fill in your profile info
3. Open a private/incognito window and register a second account with opposite gender
4. In the first account, go to Home tab - you should see the second profile
5. Click Like to swipe right
6. Go to Matches tab to see if they liked you back (create a match)
7. Go to Matches tab and send a message

## Troubleshooting

### Port 5001 already in use
```bash
cd CST2550Project
dotnet run --urls "https://localhost:5002"
```

### Database error
```bash
cd CST2550Project
dotnet ef database drop --force
dotnet ef database update
```

### Migration error
```bash
cd CST2550Project
dotnet ef migrations remove
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### No profiles in discovery
You need at least 2 users with opposite genders:
- User 1: Male, Looking for Female
- User 2: Female, Looking for Male

User 1 will see User 2 in discovery.

## Tabs

- **Home** - Swipe through profiles
- **Search** - Filter profiles
- **Matches** - Your matches and messages
- **Profile** - View and edit your profile
- **Settings** - Account settings

## Features

- Register and login
- Create/edit profile
- Swipe profiles (like, pass, superlike)
- Automatic match detection
- Send messages to matches
- Mark messages as read

## More Info

See README.md for:
- Full project structure
- All API endpoints
- Database schema
- Common issues
- Development info

## Help

If something breaks:
1. Check browser console (F12) for errors
2. Check terminal output for backend errors
3. See README.md for troubleshooting
