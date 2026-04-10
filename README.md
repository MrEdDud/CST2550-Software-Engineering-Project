# CST2550 Software Engineering Project – Dating Management System

## Overview

This project is a group-based Dating Management System developed as part of the CST2550 Software Engineering module.

The system allows users to:

- Register and log in
- Create and manage profiles
- Discover and swipe on other users
- Match with other users
- View and manage matches
- Message with your matches
- Use AI to help you talk to your matches

The project is built using C# (.NET) with a layered architecture including frontend components, backend services, database integration, and custom data structures for efficient data handling and search functionality.

---

## Repository Structure

### Root Files

- `report.pdf` → Final coursework report (design, analysis, testing, conclusion)
- `daily-meetings.pdf` → Full Scrum documentation (35 daily stand-up meetings)
- `sql-statements.txt` → SQL scripts used to create and manage the database schema

---

### Main Project Folder

`CST2550-Software-Engineering-Project/`

This folder contains the full application source code:

#### Components

Frontend UI components responsible for user interaction and interface logic.

#### Services

Backend business logic including:

- Authentication
- Profile management
- Matching system
- Messaging logic
- Session logic

#### Controllers

API endpoints that handle HTTP requests and connect frontend with backend services.

#### Models

Core data models representing:

- Users
- Profiles
- Matches
- Messages

#### DTOs (Data Transfer Objects)

Simplified objects used for transferring data between layers.

#### Data

Database context and configuration:

- Entity Framework DbContext
- Database connection setup

#### Migrations

Database migration files used to create and update schema structure.

#### wwwroot

Static assets including:

- CSS styling
- Images
- Country data

---

## How to Run the Project

### Prerequisites

Make sure you have installed:

- .NET SDK (recommended .NET 8 or later)
- SQL Server (or compatible database engine)
- Visual Studio 2022

---

### Step 1: Clone the Repository

```bash

git clone https://github.com/MrEdDud/CST2550-Software-Engineering-Project.git
cd CST2550-Software-Engineering-Project

```


### Step 2: Set Up the Database

```bash

dotnet ef database update

```

### Step 3: Build and then Run the application

```bash

dotnet build
dotnet run

```

From there you can access the website by using the localhost address that it gives you in the terminal.

---

## How to Use the AI feature in the project

### Step 1: Run this command in the terminal with your own AI API key

I reccommend you use OpenAI or else you will get errors

```bash

dotnet user-secrets set "OpenAI:ApiKey" "your-key-here"

```
