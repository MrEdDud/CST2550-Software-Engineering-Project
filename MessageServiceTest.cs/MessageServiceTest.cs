using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using CST2550Project.Data;
using CST2550Project.Services;
using CST2550Project.DTOs;
using CST2550Project.Models;

namespace MessageServiceTest.cs
{
    [TestFixture]
    public class MessageServiceTests
    {
        private DatingAppContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<DatingAppContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new DatingAppContext(options);
        }

        [Test]
        public async Task SendMessageAsync_creates_message_and_returns_dto_when_match_exists()
        {
            var ctx = CreateContext("SendMessage");

            var user1 = new User { Username = "u1", Email = "u1@example.com", PasswordHash = "h" };
            var user2 = new User { Username = "u2", Email = "u2@example.com", PasswordHash = "h" };
            ctx.Users.AddRange(user1, user2);
            await ctx.SaveChangesAsync();

            ctx.Profiles.AddRange(
                new ProfileModel { UserId = user1.Id, Name = "User1", Age = 25, Gender = "M", LookingFor = "F" },
                new ProfileModel { UserId = user2.Id, Name = "User2", Age = 24, Gender = "F", LookingFor = "M" }
            );
            await ctx.SaveChangesAsync();

            var match = new Match { User1Id = Math.Min(user1.Id, user2.Id), User2Id = Math.Max(user1.Id, user2.Id) };
            ctx.Matches.Add(match);
            await ctx.SaveChangesAsync();

            var svc = new MessageService(ctx);

            var dto = new SendMessageDto { MatchId = match.Id, Content = " Hello world " };

            var result = await svc.SendMessageAsync(user1.Id, dto);

            Assert.That(result, Is.Not.Null);
            Assert.That(result!.Content, Is.EqualTo("Hello world"));
            Assert.That(result.IsMine, Is.True);

            var stored = await ctx.Messages.FirstOrDefaultAsync();
            Assert.That(stored, Is.Not.Null);
            Assert.That(stored!.Content, Is.EqualTo("Hello world"));
        }

        [Test]
        public async Task GetMessagesAsync_marks_unread_as_read_and_returns_messages()
        {
            var ctx = CreateContext("GetMessages");

            var u1 = new User { Username = "u1", Email = "u1@example.com", PasswordHash = "h" };
            var u2 = new User { Username = "u2", Email = "u2@example.com", PasswordHash = "h" };
            ctx.Users.AddRange(u1, u2);
            await ctx.SaveChangesAsync();

            ctx.Profiles.AddRange(
                new ProfileModel { UserId = u1.Id, Name = "User1", Age = 25, Gender = "M", LookingFor = "F" },
                new ProfileModel { UserId = u2.Id, Name = "User2", Age = 24, Gender = "F", LookingFor = "M" }
            );
            await ctx.SaveChangesAsync();

            var match = new Match { User1Id = Math.Min(u1.Id, u2.Id), User2Id = Math.Max(u1.Id, u2.Id) };
            ctx.Matches.Add(match);
            await ctx.SaveChangesAsync();

            ctx.Messages.AddRange(
                new Message { MatchId = match.Id, SenderId = u2.Id, Content = "Hi", IsRead = false },
                new Message { MatchId = match.Id, SenderId = u1.Id, Content = "Hello", IsRead = false }
            );
            await ctx.SaveChangesAsync();

            var svc = new MessageService(ctx);
            var msgsForU1 = await svc.GetMessagesAsync(u1.Id, match.Id);

            // u1 should see 2 messages, and the message from u2 should be marked read
            Assert.That(msgsForU1.Count, Is.EqualTo(2));
            var fromU2 = msgsForU1.First(m => m.SenderId == u2.Id);
            Assert.That(fromU2.IsRead, Is.True);

            var unreadCount = await svc.GetUnreadCountAsync(u1.Id);
            Assert.That(unreadCount, Is.EqualTo(0));
        }

        [Test]
        public async Task DeleteMessageAsync_allows_sender_to_delete_and_returns_true()
        {
            var ctx = CreateContext("DeleteMessage");

            var u1 = new User { Username = "u1", Email = "u1@example.com", PasswordHash = "h" };
            ctx.Users.Add(u1);
            await ctx.SaveChangesAsync();

            var msg = new Message { SenderId = u1.Id, Content = "To be deleted" };
            ctx.Messages.Add(msg);
            await ctx.SaveChangesAsync();

            var svc = new MessageService(ctx);
            var res = await svc.DeleteMessageAsync(u1.Id, msg.Id);
            Assert.That(res, Is.True);

            var stored = await ctx.Messages.FindAsync(msg.Id);
            Assert.That(stored, Is.Null);
        }
    }
}
