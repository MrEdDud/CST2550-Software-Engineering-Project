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
    public class ControllersE2EAdditionalTests
    {
        private CustomWebApplicationFactory<Program> _factory = null!;

        [SetUp]
        public void Setup()
        {
            _factory = new CustomWebApplicationFactory<Program>();
        }

        [TearDown]
        public void TearDown()
        {
            _factory.Dispose();
        }

        private async Task<HttpClient> RegisterAndLoginClientAsync(string name, string email, string password)
        {
            var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

            var reg = new RegisterDto { Name = name, Email = email, Password = password, Age = 25 };
            var regResp = await client.PostAsJsonAsync("/api/auth/register", reg);
            regResp.EnsureSuccessStatusCode();

            var loginDto = new LoginDto { Username = name, Password = password };
            var loginResp = await client.PostAsJsonAsync("/api/auth/login", loginDto);
            loginResp.EnsureSuccessStatusCode();

            return client;
        }

        [Test]
        public async Task Profile_Update_And_GetMe_Works()
        {
            var username = "e2e_profile_" + System.Guid.NewGuid().ToString("N").Substring(0,8);
            var client = await RegisterAndLoginClientAsync(username, username + "@example.com", "Pass123!");

            var update = new UpdateProfileDto { Name = "Updated Name", Bio = "Hello bio" };
            var putResp = await client.PutAsJsonAsync("/api/profiles/me", update);
            putResp.EnsureSuccessStatusCode();

            var getResp = await client.GetAsync("/api/profiles/me");
            getResp.EnsureSuccessStatusCode();
            var profile = await getResp.Content.ReadFromJsonAsync<ProfileDto>();
            Assert.That(profile, Is.Not.Null);
            Assert.That(profile!.Name, Is.EqualTo("Updated Name"));
            Assert.That(profile.Bio, Is.EqualTo("Hello bio"));
        }

        [Test]
        public async Task Discover_Returns_Other_Profiles()
        {
            var userA = "e2e_disc_a_" + System.Guid.NewGuid().ToString("N").Substring(0,8);
            var userB = "e2e_disc_b_" + System.Guid.NewGuid().ToString("N").Substring(0,8);

            var clientA = await RegisterAndLoginClientAsync(userA, userA + "@example.com", "Pass123!");
            var clientB = await RegisterAndLoginClientAsync(userB, userB + "@example.com", "Pass123!");

            // update B profile to Female so A (looking for default) may see
            var updB = new UpdateProfileDto { Name = "B Name", Age = 26, Gender = "F", LookingFor = "M" };
            var putRespB = await clientB.PutAsJsonAsync("/api/profiles/me", updB);
            putRespB.EnsureSuccessStatusCode();

            // clientA discover
            var discoverResp = await clientA.GetAsync("/api/profiles/discover?Count=10&Gender=F");
            discoverResp.EnsureSuccessStatusCode();
            var list = await discoverResp.Content.ReadFromJsonAsync<System.Collections.Generic.List<ProfileDto>>();
            Assert.That(list, Is.Not.Null);
            Assert.That(list!.Any(p => p.UserId != 0 && p.Username != userA), Is.True);
        }

        [Test]
        public async Task LikesReceived_And_Unmatch_Flow()
        {
            var a = "e2e_like_a_" + System.Guid.NewGuid().ToString("N").Substring(0,8);
            var b = "e2e_like_b_" + System.Guid.NewGuid().ToString("N").Substring(0,8);

            var clientA = await RegisterAndLoginClientAsync(a, a + "@example.com", "Pass123!");
            var clientB = await RegisterAndLoginClientAsync(b, b + "@example.com", "Pass123!");

            // B likes A
            var loginB = new LoginDto { Username = b, Password = "Pass123!" };
            var likeResp = await clientB.PostAsJsonAsync("/api/matches/swipe", new SwipeDto { TargetUserId = 0, IsLike = true });
            // We need numeric user ids; fetch A's profile id by querying profiles discover? but easier: get profile list and find A
            var aProfileResp = await clientA.GetAsync("/api/profiles/me");
            aProfileResp.EnsureSuccessStatusCode();
            var aProfile = await aProfileResp.Content.ReadFromJsonAsync<ProfileDto>();
            Assert.That(aProfile, Is.Not.Null);

            // Now have B like A by using A's UserId
            var respLike = await clientB.PostAsJsonAsync("/api/matches/swipe", new SwipeDto { TargetUserId = aProfile!.UserId, IsLike = true });
            respLike.EnsureSuccessStatusCode();

            // A likes B to create match
            var respLikeA = await clientA.PostAsJsonAsync("/api/matches/swipe", new SwipeDto { TargetUserId = (await clientB.GetFromJsonAsync<ProfileDto>("/api/profiles/me"))!.UserId, IsLike = true });
            respLikeA.EnsureSuccessStatusCode();

            // A gets matches
            var matchesResp = await clientA.GetAsync("/api/matches");
            matchesResp.EnsureSuccessStatusCode();
            var matches = await matchesResp.Content.ReadFromJsonAsync<System.Collections.Generic.List<MatchDto>>();
            Assert.That(matches, Is.Not.Null);
            Assert.That(matches!.Count, Is.GreaterThanOrEqualTo(1));

            var matchId = matches.First().Id;

            // A unmatch
            var unmatchResp = await clientA.DeleteAsync($"/api/matches/{matchId}");
            unmatchResp.EnsureSuccessStatusCode();
        }

        [Test]
        public async Task Messages_UnreadCount_And_Delete_Via_Api()
        {
            var a = "e2e_msg_a_" + System.Guid.NewGuid().ToString("N").Substring(0,8);
            var b = "e2e_msg_b_" + System.Guid.NewGuid().ToString("N").Substring(0,8);

            var clientA = await RegisterAndLoginClientAsync(a, a + "@example.com", "Pass123!");
            var clientB = await RegisterAndLoginClientAsync(b, b + "@example.com", "Pass123!");

            // create mutual match
            var respLikeB = await clientB.PostAsJsonAsync("/api/matches/swipe", new SwipeDto { TargetUserId = (await clientA.GetFromJsonAsync<ProfileDto>("/api/profiles/me"))!.UserId, IsLike = true });
            respLikeB.EnsureSuccessStatusCode();
            var respLikeA = await clientA.PostAsJsonAsync("/api/matches/swipe", new SwipeDto { TargetUserId = (await clientB.GetFromJsonAsync<ProfileDto>("/api/profiles/me"))!.UserId, IsLike = true });
            respLikeA.EnsureSuccessStatusCode();

            var matchesResp = await clientA.GetAsync("/api/matches");
            matchesResp.EnsureSuccessStatusCode();
            var matches = await matchesResp.Content.ReadFromJsonAsync<System.Collections.Generic.List<MatchDto>>();
            Assert.That(matches, Is.Not.Null);
            var matchId = matches!.First().Id;

            // send message from A
            var sendResp = await clientA.PostAsJsonAsync("/api/messages", new SendMessageDto { MatchId = matchId, Content = "E2E Hello" });
            sendResp.EnsureSuccessStatusCode();
            var sent = await sendResp.Content.ReadFromJsonAsync<MessageDto>();
            Assert.That(sent, Is.Not.Null);

            // unread count for B
            var unreadResp = await clientB.GetAsync("/api/messages/unread-count");
            unreadResp.EnsureSuccessStatusCode();
            var unreadObj = await unreadResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            // extract count
            int count = 0;
            if (unreadObj.TryGetProperty("count", out var c)) count = c.GetInt32();
            Assert.That(count, Is.GreaterThanOrEqualTo(1));

            // delete message as A
            var delResp = await clientA.DeleteAsync($"/api/messages/{sent!.Id}");
            delResp.EnsureSuccessStatusCode();
        }
    }
}
