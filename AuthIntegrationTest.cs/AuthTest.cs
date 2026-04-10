using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace CST2550Project.Tests.IntegrationTests
{
    [TestFixture]
    public class AuthIntegrationTests
    {
        private CustomWebApplicationFactory<Program> _factory;
        private HttpClient _client;

        [SetUp]
        public void Setup()
        {
            // Boots up the API with the In-Memory DB
            _factory = new CustomWebApplicationFactory<Program>();
            _client = _factory.CreateClient();
        }

        [Test]
        public async Task RegisterEndpoint_ShouldSaveUserToDatabase()
        {
            // 1. Arrange: Create the payload your API expects
            var newUser = new
            {
                Name = "integration_test_user",
                Password = "Password123!",
                Email = "test@example.com",
                Age = 25
            };

            // 2. Act: Send a real POST request to your endpoint
            var response = await _client.PostAsJsonAsync("/api/auth/register", newUser);

            // 3. Assert: Verify the response is successful (200 OK)
            response.EnsureSuccessStatusCode();
        }

        [TearDown]
        public void TearDown()
        {
            _client.Dispose();
            _factory.Dispose();
        }
    }
}