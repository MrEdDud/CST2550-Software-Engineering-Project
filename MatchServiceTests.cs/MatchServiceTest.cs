using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using CST2550Project.Data;
using CST2550Project.Services;
using CST2550Project.DTOs;
using CST2550Project.Models;

namespace MatchServiceTests
{
    [TestFixture]
    public class MatchServiceTests
    {
        private DatingAppContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<DatingAppContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new DatingAppContext(options);
        }

        [Test]
        public async Task SwipeAsync_creates_like_and_match_when_mutual()
        {
            // Arrange
            var ctx = CreateContext("SwipeMutual");
            // seed two users and profiles
            var userA = new User { Username = "userA", Email = "a@example.com", PasswordHash = "h" };
            var userB = new User { Username = "userB", Email = "b@example.com", PasswordHash = "h" };
            ctx.Users.AddRange(userA, userB);
            await ctx.SaveChangesAsync();

            ctx.Profiles.AddRange(
                new ProfileModel { UserId = userA.Id, Name = "A", Age = 25, Gender = "M", LookingFor = "F" },
                new ProfileModel { UserId = userB.Id, Name = "B", Age = 24, Gender = "F", LookingFor = "M" }
            );
            await ctx.SaveChangesAsync();

            // userB previously liked userA -> mutual when userA likes userB
            ctx.Likes.Add(new Like { FromUserId = userB.Id, ToUserId = userA.Id });
            await ctx.SaveChangesAsync();

            var svc = new MatchService(ctx);

            var swipeDto = new SwipeDto { TargetUserId = userB.Id, IsLike = true };

            // Act
            var result = await svc.SwipeAsync(userA.Id, swipeDto);

            // Assert
            Assert.That(result.IsMatch, Is.True, "Expected a match when both liked each other");
            Assert.That(result.Match, Is.Not.Null);

            var matches = await ctx.Matches.ToListAsync();
            Assert.That(matches.Count, Is.EqualTo(1));
            var like = await ctx.Likes.FirstOrDefaultAsync(l => l.FromUserId == userA.Id && l.ToUserId == userB.Id);
            Assert.That(like, Is.Not.Null, "Like from userA to userB should be created");
        }

        [Test]
        public async Task GetLikesReceivedAsync_returns_profiles_of_likers_excluding_matches()
        {
            var ctx = CreateContext("LikesReceived");

            var userTarget = new User { Username = "target", Email = "t@example.com", PasswordHash = "h" };
            var liker = new User { Username = "liker", Email = "l@example.com", PasswordHash = "h" };
            ctx.Users.AddRange(userTarget, liker);
            await ctx.SaveChangesAsync();

            ctx.Profiles.AddRange(
                new ProfileModel { UserId = userTarget.Id, Name = "T", Age = 30, Gender = "F", LookingFor = "M" },
                new ProfileModel { UserId = liker.Id, Name = "L", Age = 28, Gender = "M", LookingFor = "F" }
            );
            await ctx.SaveChangesAsync();

            ctx.Likes.Add(new Like { FromUserId = liker.Id, ToUserId = userTarget.Id });
            await ctx.SaveChangesAsync();

            var svc = new MatchService(ctx);
            var received = await svc.GetLikesReceivedAsync(userTarget.Id);

            Assert.That(received.Count, Is.EqualTo(1));
            Assert.That(received[0].UserId, Is.EqualTo(liker.Id));
        }
    }
}
