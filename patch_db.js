const fs = require('fs');

// Patch appsettings.json to use SQLite connection string
const appSettingsString = fs.readFileSync('appsettings.json', 'utf-8');
const newAppSettings = appSettingsString.replace(
    '"DefaultConnection": "Server=(localdb)\\\\MSSQLLocalDB;Database=CST2550DatingAppDb;Trust\\ned_Connection=True;MultipleActiveResultSets=true"',
    '"DefaultConnection": "Data Source=cst2550.db"'
).replace(
    '"DefaultConnection": "Server=(localdb)\\\\MSSQLLocalDB;Database=CST2550DatingAppDb;Trusted_Connection=True;MultipleActiveResultSets=true"',
    '"DefaultConnection": "Data Source=cst2550.db"'
);
fs.writeFileSync('appsettings.json', newAppSettings, 'utf-8');

// Patch Program.cs to use SQLite
const programString = fs.readFileSync('Program.cs', 'utf-8');
const newProgram = programString.replace(
    'options.UseSqlServer(',
    'options.UseSqlite('
);
fs.writeFileSync('Program.cs', newProgram, 'utf-8');
