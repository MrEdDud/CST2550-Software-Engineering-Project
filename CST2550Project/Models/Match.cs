namespace CST2550Project.Models
{
    public class Match
    {
        public int Id { get; set; }

        public int User1Id { get; set; }

        public int User2Id { get; set; }

        public DateTime MatchedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; } = true;

        public User? User1 { get; set; }
        public User? User2 { get; set; }
        public List<Message> Messages { get; set; } = new();
    }
}
