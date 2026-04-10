using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;
using Assert = NUnit.Framework.Assert;

using CST2550Project.Data;
using CST2550Project.DTOs;
using CST2550Project.Models;
using CST2550Project.Services;
using System.Linq;

namespace CST2550Project.Tests
{
    [TestFixture]
    public class AuthServiceTests
    {
        // Helper method to create a fresh, empty fake database for each test
        private DatingAppContext GetInMemoryDbContext(string dbName)
        {   
            var options = new DbContextOptionsBuilder<DatingAppContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
            return new DatingAppContext(options);
        }

        // Helper method to fake the appsettings.json for JWT keys
        private IConfiguration GetFakeConfiguration()
        {
            var inMemorySettings = new Dictionary<string, string> {
                {"Jwt:Key", "ThisIsASuperSecretTestKeyThatIsLongEnough!!"},
                {"Jwt:Issuer", "TestApp"},
                {"Jwt:Audience", "TestApp"}
            };
            return new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
        }

        [Test]
        public async Task RegisterAsync_ValidNewUser_ReturnsAuthResponseAndSavesToDb()
        {
            // 1. ARRANGE
            var context = GetInMemoryDbContext("RegisterSuccessDb");
            var config = GetFakeConfiguration();
            var service = new AuthService(context, config);

            var newUserDto = new RegisterDto
            {
                Name = "TestUser",
                Email = "test@test.com",
                Password = "Password123!",
                Age = 22
            };

            // 2. ACT
            var result = await service.RegisterAsync(newUserDto);

            // 3. ASSERT (NUnit)
            Assert.That(result, Is.Not.Null, "Result should not be null on successful registration");
            Assert.That(result.Username, Is.EqualTo("TestUser"));
            Assert.That(result.Token, Is.Not.Null, "A JWT token should have been generated");

            // Verify it actually saved to the fake database
            var savedUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "TestUser");
            Assert.That(savedUser, Is.Not.Null, "User was not saved to the database");
        }

        [Test]
        public async Task RegisterAsync_DuplicateUsername_ThrowsInvalidOperationException()
        {
            // 1. ARRANGE
            var context = GetInMemoryDbContext("DuplicateUsernameDb");
            var config = GetFakeConfiguration();
            var service = new AuthService(context, config);

            // Manually add a user to the fake database first
            context.Users.Add(new User { Username = "ExistingUser", Email = "first@test.com", PasswordHash = "hash" });
            await context.SaveChangesAsync();

            var duplicateDto = new RegisterDto
            {
                Name = "ExistingUser", // Same username!
                Email = "different@test.com",
                Password = "Password123!",
                Age = 25
            };

            // 2 & 3. ACT & ASSERT (NUnit) - use try/catch to avoid async assertion overload differences
            try
            {
                await service.RegisterAsync(duplicateDto);
                Assert.Fail("Expected InvalidOperationException");
            }
            catch (InvalidOperationException ex)
            {
                Assert.That(ex.Message, Is.EqualTo("Username already taken"));
            }
        }

        [Test]
        public async Task LoginAsync_ValidCredentials_ReturnsAuthResponse()
        {
            // 1. ARRANGE
            var context = GetInMemoryDbContext("LoginSuccessDb");
            var config = GetFakeConfiguration();
            var service = new AuthService(context, config);

            // Register a user first so they are hashed properly in the DB
            await service.RegisterAsync(new RegisterDto
            {
                Name = "LoginTester",
                Email = "login@test.com",
                Password = "MySecretPassword123",
                Age = 21
            });

            var loginDto = new LoginDto
            {
                Username = "LoginTester",
                Password = "MySecretPassword123" // Correct password
            };

            // 2. ACT
            var result = await service.LoginAsync(loginDto);

            // 3. ASSERT (NUnit)
            Assert.That(result, Is.Not.Null, "Login should succeed with correct credentials");
            Assert.That(result.Token, Is.Not.Null, "Login should return a JWT token");
            Assert.That(result.HasProfile, Is.True, "User should have a profile created");
        }

        [Test]
        public async Task LoginAsync_WrongPassword_ReturnsNull()
        {
            // 1. ARRANGE
            var context = GetInMemoryDbContext("LoginFailDb");
            var config = GetFakeConfiguration();
            var service = new AuthService(context, config);

            await service.RegisterAsync(new RegisterDto
            {
                Name = "WrongPassTester",
                Email = "wrong@test.com",
                Password = "CorrectPassword123",
                Age = 22
            });

            var loginDto = new LoginDto
            {
                Username = "WrongPassTester",
                Password = "WrongPassword999" // Incorrect password
            };

            // 2. ACT
            var result = await service.LoginAsync(loginDto);

            // 3. ASSERT (NUnit)
            Assert.That(result, Is.Null, "Login should fail and return null when the password is wrong");
        }
    }
}