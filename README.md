# Dating App

A simple dating application built with .NET 6+ backend and vanilla JavaScript frontend.

## Features

- User registration and login with JWT authentication
- Profile creation and editing
- Discovery with swiping (like, pass, superlike)
- Match detection when both users like each other
- Messaging between matched users
- Profile filtering by age, gender, and preferences

## Tech Stack

- Backend: .NET 6+, Entity Framework Core, SQLite
- Frontend: Vanilla JavaScript, HTML, CSS
- Authentication: JWT tokens
- Database: SQLite (created at runtime)

## Getting Started

### Requirements

- .NET 6 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Setup

#### Option 1: Automated (Recommended)

macOS/Linux:
```bash
chmod +x setup.sh
./setup.sh
```

Windows:
```bash
setup.bat
```

#### Option 2: Manual

```bash
cd CST2550Project

# Create database
dotnet ef migrations add InitialCreate
dotnet ef database update

# Run the app
dotnet run
```

The app will start at `https://localhost:5001`

## First Time Use

1. Open `https://localhost:5001` in your browser
2. Click "Sign Up" and create an account
3. Fill in your profile information
4. Go to Home tab to see profiles and start swiping
5. Create another account to test matching and messages

## Project Structure

```
CST2550Project/
├── Program.cs              - App configuration
├── Models/                 - User, Profile, Match, Message, Like entities
├── Controllers/            - API endpoints
├── Services/               - Business logic
├── DTOs/                   - Request/response objects
├── Data/                   - Database context
└── wwwroot/                - Frontend (HTML, CSS, JavaScript)
    ├── index.html
    ├── login.html
    ├── register.html
    ├── css/styles.css
    └── js/
        ├── api.js          - API calls
        ├── app.js          - Main app logic
        ├── auth.js         - Auth functions
        └── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Get JWT token

### Profiles
- `GET /api/profiles/{id}` - Get profile info
- `PUT /api/profiles/{id}` - Update profile
- `POST /api/profiles` - Create profile

### Discovery
- `GET /api/discovery/profiles` - Get profiles to swipe
- `POST /api/discovery/swipe` - Like/pass/superlike

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/{matchId}` - Get conversation

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/match/{matchId}` - Get conversation messages
- `DELETE /api/messages/{messageId}` - Delete message
- `PUT /api/messages/match/{matchId}/read` - Mark messages as read

## Database

SQLite database (`datingapp.db`) is created automatically when the app runs.

Tables:
- Users - User accounts with login info
- Profiles - User profiles with bio, photos, preferences
- Likes - Swipe records
- Matches - Mutual likes
- Messages - Chat messages between matches

## Security

- Passwords are hashed using PBKDF2 with salt
- JWT tokens expire after 7 days
- All endpoints require authentication (except login/register)
- Input validation on all API endpoints

## Common Issues

**Port 5001 already in use?**
```bash
dotnet run --urls "https://localhost:5002"
```

**Need to reset database?**
```bash
cd CST2550Project
dotnet ef database drop --force
dotnet ef database update
```

**Seeing migration errors?**
```bash
cd CST2550Project
dotnet ef migrations remove
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Development

The app uses:
- .NET Entity Framework for database operations
- Dependency injection for services
- LINQ for database queries
- JWT for stateless authentication
- localStorage for client-side JWT storage
- CSS variables for consistent theming

## License

School project for CST2550 Software Engineering
