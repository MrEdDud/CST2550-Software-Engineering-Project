# Zelove Dating App 💕

A modern, full-stack dating application built with **ASP.NET Core** (C#) backend and a beautiful **HTML/CSS/JavaScript** frontend.

## Features ✨

### User Authentication
- Secure registration with email validation
- JWT-based login/logout
- Password hashing with PBKDF2

### Profile Management
- Create and edit your dating profile
- Upload multiple photos
- Add interests and hobbies
- Set discovery preferences (age range, distance)

### Discover & Match
- Swipe through profiles (Tinder-style cards)
- Like, Super Like, or Pass
- Instant match notifications when both users like each other
- Keyboard shortcuts (← Pass, → Like, ↑ Super Like)

### Messaging
- Real-time chat with matches
- Message history
- Unread message indicators
- Unmatch functionality

## Tech Stack 🛠️

### Backend
- **ASP.NET Core** Web API (.NET 9.0)
- **Entity Framework Core** with SQLite
- **JWT Authentication**
- RESTful API design

### Frontend
- **HTML5** with semantic markup
- **CSS3** with modern features (CSS Grid, Flexbox, Variables, Animations)
- **Vanilla JavaScript** (ES6+)
- **Font Awesome** icons
- **Google Fonts** (Poppins)

## Project Structure 📁

```
CST2550Project/
├── Controllers/           # API Controllers
│   ├── AuthController.cs
│   ├── ProfilesController.cs
│   ├── MatchesController.cs
│   └── MessagesController.cs
├── Models/               # Data Models
│   ├── User.cs
│   ├── Profile.cs
│   ├── Like.cs
│   ├── Match.cs
│   └── Message.cs
├── DTOs/                 # Data Transfer Objects
│   └── DTOs.cs
├── Data/                 # Database Context
│   └── DatingAppContext.cs
├── Services/             # Business Logic
│   ├── AuthService.cs
│   ├── ProfileService.cs
│   ├── MatchService.cs
│   └── MessageService.cs
├── wwwroot/              # Frontend Files
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── app.js
│   │   ├── matches.js
│   │   └── profile.js
│   ├── index.html        # Discovery page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── matches.html      # Matches & chat
│   └── profile.html      # Profile settings
└── Program.cs            # App configuration
```

## Getting Started 🚀

### Prerequisites
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) or later
- Visual Studio 2022, VS Code, or JetBrains Rider

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CST2550Project
   ```

2. **Restore packages**
   ```bash
   dotnet restore
   ```

3. **Run the application**
   ```bash
   dotnet run
   ```

4. **Open in browser**
   - Frontend: https://localhost:5001 (or http://localhost:5000)
   - API Docs: https://localhost:5001/swagger

### Demo Accounts

The app comes with pre-seeded demo accounts:

| Username | Password | Name |
|----------|----------|------|
| alex_adventure | Password123! | Alex |
| emma_sunset | Password123! | Emma |
| mike_music | Password123! | Mike |
| sophie_books | Password123! | Sophie |
| james_fitness | Password123! | James |
| olivia_art | Password123! | Olivia |

## API Endpoints 📡

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Profiles
- `GET /api/profiles/me` - Get current user's profile
- `PUT /api/profiles/me` - Update profile
- `GET /api/profiles/discover` - Get discovery feed
- `GET /api/profiles/{id}` - Get specific profile

### Matches
- `POST /api/matches/swipe` - Like/pass on a profile
- `GET /api/matches` - Get all matches
- `GET /api/matches/likes` - Get users who liked you
- `DELETE /api/matches/{id}` - Unmatch

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/match/{matchId}` - Get conversation
- `GET /api/messages/unread-count` - Get unread count

## Design Decisions 📐

### Why SQLite?
- No separate database server needed
- Perfect for development and demos
- Easy to deploy (single file)
- Can be migrated to SQL Server/PostgreSQL for production

### Why Vanilla JavaScript?
- No build tools required
- Easy to understand for students
- Demonstrates core web concepts
- Lightweight and fast

### Security Considerations
- Passwords are hashed using PBKDF2
- JWT tokens expire after 7 days
- CORS configured for frontend access
- Input validation on all endpoints

## Screenshots 📸

### Login Page
Beautiful gradient background with animated floating hearts, clean form design.

### Discovery Page
Card-based profile browsing with swipe gestures and keyboard support.

### Matches & Chat
Split view with match list and real-time messaging.

### Profile Settings
Comprehensive profile editor with photo gallery and preference settings.

## Contributing 🤝

This is a university project for CST2550 Software Engineering. Feel free to fork and extend!

## License 📄

MIT License - Feel free to use for educational purposes.

---

Made with ❤️ for CST2550 Software Engineering Project