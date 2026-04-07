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

            modelBuilder.Entity<Match>()
                .HasIndex(m => new { m.User1Id, m.User2Id })
                .IsUnique();

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
    }
}