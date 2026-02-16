namespace CST2550Project.Models
{
    public class Like
    {
        public int Id { get; set; }

        public int FromUserId { get; set; }

        public int ToUserId { get; set; }

        public bool IsSuperLike { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? FromUser { get; set; }
        public User? ToUser { get; set; }
    }
}
