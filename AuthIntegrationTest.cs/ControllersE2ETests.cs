using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using NUnit.Framework;
using CST2550Project.DTOs;
using System.Linq;

namespace CST2550Project.Tests.IntegrationTests
{
    [TestFixture]
    public class ControllersE2ETests
    {
        private CustomWebApplicationFactory<Program> _factory = null!;
        private HttpClient _client = null!;

        [SetUp]
        public void Setup()
        {
            _factory = new CustomWebApplicationFactory<Program>();
            // Ensure cookies are handled so login persists authentication for subsequent requests
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        }

        [TearDown]
        public void TearDown()
        {
            _client.Dispose();
            _factory.Dispose();
        }

        private async Task<AuthResponseDto> RegisterAndLoginAsync(string name, string email, string password)
        {
            var reg = new RegisterDto { Name = name, Email = email, Password = password, Age = 25 };
            var regResp = await _client.PostAsJsonAsync("/api/auth/register", reg);
            regResp.EnsureSuccessStatusCode();

            var loginDto = new LoginDto { Username = name, Password = password };
            var loginResp = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
            loginResp.EnsureSuccessStatusCode();

            var auth = await loginResp.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.That(auth, Is.Not.Null);
            return auth!;
        }

        [Test]
        public async Task Auth_Profile_Matches_Messages_Flow()
        {
            // Register two users
            var userA = await RegisterAndLoginAsync("e2e_user_a", "a@example.com", "Password1!");
            // logout cookies between flows by creating a new client for second user registration/login
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
            var userB = await RegisterAndLoginAsync("e2e_user_b", "b@example.com", "Password1!");

            // Login as userB to like userA
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
            var loginB = new LoginDto { Username = "e2e_user_b", Password = "Password1!" };
            var loginRespB = await _client.PostAsJsonAsync("/api/auth/login", loginB);
            loginRespB.EnsureSuccessStatusCode();

            var swipeToA = new SwipeDto { TargetUserId = userA.UserId, IsLike = true };
            var resp1 = await _client.PostAsJsonAsync("/api/matches/swipe", swipeToA);
            resp1.EnsureSuccessStatusCode();

            // Now login as userA and like userB to create a match
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
            var loginA = new LoginDto { Username = "e2e_user_a", Password = "Password1!" };
            var loginRespA = await _client.PostAsJsonAsync("/api/auth/login", loginA);
            loginRespA.EnsureSuccessStatusCode();

            var swipeToB = new SwipeDto { TargetUserId = userB.UserId, IsLike = true };
            var resp2 = await _client.PostAsJsonAsync("/api/matches/swipe", swipeToB);
            resp2.EnsureSuccessStatusCode();

            // Get matches for userA
            var matchesResp = await _client.GetAsync("/api/matches");
            matchesResp.EnsureSuccessStatusCode();
            var matches = await matchesResp.Content.ReadFromJsonAsync<System.Collections.Generic.List<MatchDto>>();
            Assert.That(matches, Is.Not.Null);
            Assert.That(matches!.Count, Is.GreaterThanOrEqualTo(1));

            var matchId = matches.First().Id;

            // Send a message from userA
            var sendDto = new SendMessageDto { MatchId = matchId, Content = "Hello from A" };
            var sendResp = await _client.PostAsJsonAsync("/api/messages", sendDto);
            sendResp.EnsureSuccessStatusCode();

            var sentMsg = await sendResp.Content.ReadFromJsonAsync<MessageDto>();
            Assert.That(sentMsg, Is.Not.Null);
            Assert.That(sentMsg!.Content, Is.EqualTo("Hello from A"));

            // Get messages for the match
            var getMsgsResp = await _client.GetAsync($"/api/messages/match/{matchId}");
            getMsgsResp.EnsureSuccessStatusCode();
            var msgs = await getMsgsResp.Content.ReadFromJsonAsync<System.Collections.Generic.List<MessageDto>>();
            Assert.That(msgs, Is.Not.Null);
            Assert.That(msgs!.Any(m => m.Content == "Hello from A"), Is.True);
        }
    }
}
