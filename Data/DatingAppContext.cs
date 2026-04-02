using Microsoft.EntityFrameworkCore;
using CST2550Project.Models;

namespace CST2550Project.Data
{
    public class DatingAppContext : DbContext
    {
        public DatingAppContext(DbContextOptions<DatingAppContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<ProfileModel> Profiles { get; set; }
        public DbSet<Like> Likes { get; set; }
        public DbSet<Match> Matches { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<ProfileModel>(entity =>
            {
                entity.HasOne(p => p.User)
                    .WithOne(u => u.Profile)
                    .HasForeignKey<ProfileModel>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Like>(entity =>
            {
                entity.HasOne(l => l.FromUser)
                    .WithMany()
                    .HasForeignKey(l => l.FromUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(l => l.ToUser)
                    .WithMany()
                    .HasForeignKey(l => l.ToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(l => new { l.FromUserId, l.ToUserId }).IsUnique();
            });

            modelBuilder.Entity<Match>(entity =>
            {
                entity.HasOne(m => m.User1)
                    .WithMany()
                    .HasForeignKey(m => m.User1Id)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.User2)
                    .WithMany()
                    .HasForeignKey(m => m.User2Id)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasOne(m => m.Match)
                    .WithMany(match => match.Messages)
                    .HasForeignKey(m => m.MatchId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // Seed demo users and profiles
        public async Task SeedDataAsync()
        {
            if (await Users.AnyAsync()) return;

            string HashPassword(string password)
            {
                byte[] salt = new byte[16];
                using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
                {
                    rng.GetBytes(salt);
                }

                var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
                    password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256);

                byte[] hash = pbkdf2.GetBytes(32);
                byte[] hashBytes = new byte[48];
                Array.Copy(salt, 0, hashBytes, 0, 16);
                Array.Copy(hash, 0, hashBytes, 16, 32);

                return Convert.ToBase64String(hashBytes);
            }

            var demoPassword = HashPassword("Password123!");

            var users = new List<User>
            {
                new User { Username = "alex_adventure", Email = "alex@example.com", PasswordHash = demoPassword },
                new User { Username = "emma_sunset", Email = "emma@example.com", PasswordHash = demoPassword },
                new User { Username = "mike_music", Email = "mike@example.com", PasswordHash = demoPassword },
                new User { Username = "sophie_books", Email = "sophie@example.com", PasswordHash = demoPassword },
                new User { Username = "james_fitness", Email = "james@example.com", PasswordHash = demoPassword },
                new User { Username = "olivia_art", Email = "olivia@example.com", PasswordHash = demoPassword },
            };

            Users.AddRange(users);
            await SaveChangesAsync();

            var profiles = new List<ProfileModel>
            {
                new ProfileModel {
                    UserId = users[0].Id,
                    Name = "Alex",
                    Age = 24,
                    Gender = "Male",
                    LookingFor = "Female",
                    Bio = "Adventure seeker 🌍 Love hiking, photography, and trying new cuisines.",
                    Location = "London, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                    HairColor = "Brown",
                    SkinTone = "Light",
                    EyeColor = "Blue",
                    BodyType = "Athletic",
                    Smoking = "Never",
                    Drinking = "Socially"
                },

                new ProfileModel {
                    UserId = users[1].Id,
                    Name = "Emma",
                    Age = 22,
                    Gender = "Female",
                    LookingFor = "Male",
                    Bio = "Sunset chaser 🌅 Coffee lover ☕",
                    Location = "Manchester, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
                    HairColor = "Blonde",
                    SkinTone = "Fair",
                    EyeColor = "Green",
                    BodyType = "Slim",
                    Smoking = "Never",
                    Drinking = "Socially"
                },

                new ProfileModel {
                    UserId = users[2].Id,
                    Name = "Mike",
                    Age = 26,
                    Gender = "Male",
                    LookingFor = "Female",
                    Bio = "Music producer 🎵",
                    Location = "Birmingham, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
                    HairColor = "Black",
                    SkinTone = "Medium",
                    EyeColor = "Brown",
                    BodyType = "Average",
                    Smoking = "Occasionally",
                    Drinking = "Socially"
                }
            };

            Profiles.AddRange(profiles);
            await SaveChangesAsync();
        }
    }
}