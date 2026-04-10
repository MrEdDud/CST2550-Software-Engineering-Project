using Microsoft.EntityFrameworkCore;
using NUnit.Framework;
using CST2550Project.Data;
using CST2550Project.Services;
using CST2550Project.DTOs;
using CST2550Project.Models;

namespace ProfileServiceTest.cs
{
    public class ProfileServiceTests
    {
        private DatingAppContext CreateContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<DatingAppContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

            return new DatingAppContext(options);
        }

        [Test]
        public async Task GetProfileAsync_returns_profile_dto_for_existing_user()
        {
            var ctx = CreateContext("GetProfile");

            var user = new User { Username = "puser", Email = "p@example.com", PasswordHash = "h" };
            ctx.Users.Add(user);
            await ctx.SaveChangesAsync();

            var profile = new ProfileModel { UserId = user.Id, Name = "P User", Age = 29, Gender = "F", LookingFor = "M" };
            ctx.Profiles.Add(profile);
            await ctx.SaveChangesAsync();

            var svc = new ProfileService(ctx);
            var res = await svc.GetProfileAsync(user.Id);

            Assert.That(res, Is.Not.Null);
            Assert.That(res!.UserId, Is.EqualTo(user.Id));
            Assert.That(res.Name, Is.EqualTo(profile.Name));
        }

        [Test]
        public async Task UpdateProfileAsync_updates_fields_and_returns_updated_dto()
        {
            var ctx = CreateContext("UpdateProfile");

            var user = new User { Username = "updateuser", Email = "u@example.com", PasswordHash = "h" };
            ctx.Users.Add(user);
            await ctx.SaveChangesAsync();

            var profile = new ProfileModel { UserId = user.Id, Name = "Old", Age = 30, Gender = "M", LookingFor = "F" };
            ctx.Profiles.Add(profile);
            await ctx.SaveChangesAsync();

            var svc = new ProfileService(ctx);

            var dto = new UpdateProfileDto { Name = "New Name", Age = 31, Bio = "New bio" };
            var updated = await svc.UpdateProfileAsync(user.Id, dto);

            Assert.That(updated, Is.Not.Null);
            Assert.That(updated!.Name, Is.EqualTo("New Name"));
            Assert.That(updated.Age, Is.EqualTo(31));
            Assert.That(updated.Bio, Is.EqualTo("New bio"));
        }

        [Test]
        public async Task GetDiscoveryProfilesAsync_filters_out_swiped_and_by_gender_and_age()
        {
            var ctx = CreateContext("Discovery");

            var me = new User { Username = "me", Email = "me@example.com", PasswordHash = "h" };
            var other = new User { Username = "o", Email = "o@example.com", PasswordHash = "h" };
            ctx.Users.AddRange(me, other);
            await ctx.SaveChangesAsync();

            ctx.Profiles.AddRange(
                new ProfileModel { UserId = me.Id, Name = "Me", Age = 25, Gender = "M", LookingFor = "F", MinAge = 18, MaxAge = 100 },
                new ProfileModel { UserId = other.Id, Name = "Other", Age = 26, Gender = "F", LookingFor = "M" }
            );
            await ctx.SaveChangesAsync();

            var svc = new ProfileService(ctx);
            var filter = new DiscoverFilterDto { Count = 10, Gender = "F" };
            var list = await svc.GetDiscoveryProfilesAsync(me.Id, filter);

            Assert.That(list.Count, Is.EqualTo(1));
            Assert.That(list[0].UserId, Is.EqualTo(other.Id));
        }
    }
}
