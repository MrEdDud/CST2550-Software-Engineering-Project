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
        public DbSet<Profile> Profiles { get; set; }
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

            modelBuilder.Entity<Profile>(entity =>
            {
                entity.HasOne(p => p.User)
                    .WithOne(u => u.Profile)
                    .HasForeignKey<Profile>(p => p.UserId)
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

            var profiles = new List<Profile>
            {
                new Profile {
                    UserId = users[0].Id, Name = "Alex", Age = 24, Gender = "Male", LookingFor = "Female",
                    Bio = "Adventure seeker 🌍 Love hiking, photography, and trying new cuisines. Always planning my next trip!",
                    Location = "London, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
                    HairColor = "Brown", SkinTone = "Light", EyeColor = "Blue", BodyType = "Athletic",
                    Occupation = "Photographer", Education = "University",
                    Hobbies = new List<string> { "Hiking", "Photography", "Cooking", "Travelling" },
                    Interests = new List<string> { "Photography", "Travel", "Cooking" },
                    Smoking = "Never", Drinking = "Socially",
                    MinAge = 20, MaxAge = 30
                },
                new Profile {
                    UserId = users[1].Id, Name = "Emma", Age = 22, Gender = "Female", LookingFor = "Male",
                    Bio = "Sunset chaser 🌅 Coffee enthusiast ☕ Dog mom. Looking for someone to share adventures with!",
                    Location = "Manchester, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
                    HairColor = "Blonde", SkinTone = "Fair", EyeColor = "Green", BodyType = "Slim",
                    Occupation = "Marketing Manager", Education = "University",
                    Hobbies = new List<string> { "Coffee", "Dogs", "Yoga", "Reading" },
                    Interests = new List<string> { "Dogs", "Coffee", "Yoga" },
                    Smoking = "Never", Drinking = "Socially",
                    MinAge = 21, MaxAge = 32
                },
                new Profile {
                    UserId = users[2].Id, Name = "Mike", Age = 26, Gender = "Male", LookingFor = "Female",
                    Bio = "Music producer by day, chef by night 🎵🍳 Let me cook you dinner and play you a song!",
                    Location = "Birmingham, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
                    HairColor = "Black", SkinTone = "Medium", EyeColor = "Brown", BodyType = "Average",
                    Occupation = "Music Producer", Education = "College",
                    Hobbies = new List<string> { "Music", "Cooking", "Guitar", "Gaming" },
                    Interests = new List<string> { "Music", "Cooking", "Guitar" },
                    Smoking = "Occasionally", Drinking = "Socially",
                    MinAge = 22, MaxAge = 30
                },
                new Profile {
                    UserId = users[3].Id, Name = "Sophie", Age = 23, Gender = "Female", LookingFor = "Male",
                    Bio = "Bookworm 📚 Tea lover ☕ Yoga enthusiast 🧘‍♀️ Looking for deep conversations and cozy movie nights.",
                    Location = "Edinburgh, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
                    HairColor = "Red", SkinTone = "Fair", EyeColor = "Hazel", BodyType = "Slim",
                    Occupation = "Teacher", Education = "Masters",
                    Hobbies = new List<string> { "Reading", "Yoga", "Movies", "Tea" },
                    Interests = new List<string> { "Books", "Yoga", "Movies" },
                    Smoking = "Never", Drinking = "Rarely",
                    MinAge = 23, MaxAge = 35
                },
                new Profile {
                    UserId = users[4].Id, Name = "James", Age = 27, Gender = "Male", LookingFor = "Female",
                    Bio = "Personal trainer 💪 Weekend hiker ⛰️ Amateur chef. Let's grab coffee and talk about our goals!",
                    Location = "Leeds, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
                    HairColor = "Brown", SkinTone = "Medium", EyeColor = "Brown", BodyType = "Athletic",
                    Occupation = "Personal Trainer", Education = "University",
                    Hobbies = new List<string> { "Fitness", "Hiking", "Cooking", "Football" },
                    Interests = new List<string> { "Fitness", "Hiking", "Cooking" },
                    Smoking = "Never", Drinking = "Socially",
                    MinAge = 21, MaxAge = 30
                },
                new Profile {
                    UserId = users[5].Id, Name = "Olivia", Age = 25, Gender = "Female", LookingFor = "Male",
                    Bio = "Artist 🎨 Gallery hopper. I'll probably want to draw you. Looking for my muse and best friend.",
                    Location = "Bristol, UK",
                    ProfilePhotoUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
                    HairColor = "Black", SkinTone = "Dark", EyeColor = "Brown", BodyType = "Curvy",
                    Occupation = "Artist", Education = "University",
                    Hobbies = new List<string> { "Painting", "Drawing", "Museums", "Photography" },
                    Interests = new List<string> { "Art", "Museums", "Photography" },
                    Smoking = "Never", Drinking = "Occasionally",
                    MinAge = 24, MaxAge = 34
                },
            };

            Profiles.AddRange(profiles);
            await SaveChangesAsync();
        }
    }
}
