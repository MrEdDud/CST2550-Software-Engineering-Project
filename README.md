\# CST2550 Software Engineering Project – Dating Management System



\## 📌 Overview

This project is a group-based Dating Management System developed as part of the CST2550 Software Engineering module.



The system allows users to:

\- Register and log in

\- Create and manage profiles

\- Discover and swipe on other users

\- Match with other users

\- View and manage matches



The project is built using C# (.NET) with a layered architecture including frontend components, backend services, database integration, and custom data structures for efficient data handling and search functionality.



\---



\## 📁 Repository Structure



\### Root Files

\- `report.pdf` → Final coursework report (design, analysis, testing, conclusion)

\- `daily-meetings.pdf` → Full Scrum documentation (35 daily stand-up meetings)

\- `sql-statements.txt` → SQL scripts used to create and manage the database schema



\---



\### Main Project Folder

`CST2550-Software-Engineering-Project/`



This folder contains the full application source code:



\#### 📂 Components

Frontend UI components responsible for user interaction and interface logic.



\#### 📂 Services

Backend business logic including:

\- Authentication

\- Profile management

\- Matching system

\- Messaging logic



\#### 📂 Controllers

API endpoints that handle HTTP requests and connect frontend with backend services.



\#### 📂 Models

Core data models representing:

\- Users

\- Profiles

\- Matches

\- Messages



\#### 📂 DTOs (Data Transfer Objects)

Simplified objects used for transferring data between layers.



\#### 📂 Data

Database context and configuration:

\- Entity Framework DbContext

\- Database connection setup



\#### 📂 Migrations

Database migration files used to create and update schema structure.



\#### 📂 wwwroot

Static assets including:

\- CSS styling

\- Images

\- Frontend assets



\---



\## ⚙️ How to Run the Project



\### Prerequisites

Make sure you have installed:

\- .NET SDK (recommended .NET 8 or later)

\- SQL Server (or compatible database engine)

\- Visual Studio 2022 / VS Code



\---



\### Step 1: Clone the Repository

```bash

git clone <your-repo-url>

cd CST2550-Software-Engineering-Project

