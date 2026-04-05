namespace CST2550Project.Services
{
    public class SessionService
    {
        public int? UserId { get; set; }
        public string? Token { get; set; }
        public string? Username { get; set; }
        public bool HasProfile { get; set; } = false;

        public bool IsLoggedIn => UserId != null;
    }
}
