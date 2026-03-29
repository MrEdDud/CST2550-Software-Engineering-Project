// data transfer objects for api requests/responses
using System.ComponentModel.DataAnnotations;

namespace CST2550Project.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [Range(18, 120)]
        public int Age { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public string LookingFor { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public bool HasProfile { get; set; }
    }

    public class ProfileDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string LookingFor { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string ProfilePhotoUrl { get; set; } = string.Empty;
        public List<string> Photos { get; set; } = new();
        public List<string> Interests { get; set; } = new();

        public string HairColor { get; set; } = string.Empty;
        public string SkinTone { get; set; } = string.Empty;
        public string EyeColor { get; set; } = string.Empty;
        public string BodyType { get; set; } = string.Empty;
        public string Ethnicity { get; set; } = string.Empty;
        public int? HeightCm { get; set; }
        public string Smoking { get; set; } = string.Empty;
        public string Drinking { get; set; } = string.Empty;
        public string Education { get; set; } = string.Empty;
        public string Occupation { get; set; } = string.Empty;
        public List<string> Hobbies { get; set; } = new();
    }

    public class UpdateProfileDto
    {
        [StringLength(50, MinimumLength = 3)]
        public string? Username { get; set; }

        [StringLength(100)]
        public string? Name { get; set; }

        [Range(18, 120)]
        public int? Age { get; set; }

        [StringLength(500)]
        public string? Bio { get; set; }

        [StringLength(100)]
        public string? Location { get; set; }

        public string? ProfilePhotoUrl { get; set; }

        public List<string>? Photos { get; set; }

        public List<string>? Interests { get; set; }

        public string? HairColor { get; set; }
        public string? SkinTone { get; set; }
        public string? EyeColor { get; set; }
        public string? BodyType { get; set; }
        public string? Ethnicity { get; set; }
        public int? HeightCm { get; set; }
        public string? Smoking { get; set; }
        public string? Drinking { get; set; }
        public string? Education { get; set; }
        public string? Occupation { get; set; }
        public List<string>? Hobbies { get; set; }

        [Range(18, 120)]
        public int? MinAge { get; set; }

        [Range(18, 120)]
        public int? MaxAge { get; set; }

        [Range(1, 500)]
        public int? MaxDistance { get; set; }

        public string? LookingFor { get; set; }
    }

    public class DiscoveryFilterDto
    {
        public int Count { get; set; } = 10;
        public string? Gender { get; set; }
        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string? HairColor { get; set; }
        public string? SkinTone { get; set; }
        public string? EyeColor { get; set; }
        public string? BodyType { get; set; }
        public string? Ethnicity { get; set; }
        public string? Smoking { get; set; }
        public string? Drinking { get; set; }
        public string? Hobby { get; set; }
        public string? Interest { get; set; }
    }

    public class DiscoveryProfileDto : ProfileDto
    {
    }

    public class SwipeDto
    {
        [Required]
        public int ToUserId { get; set; }

        [Required]
        public bool IsLike { get; set; }

        public bool IsSuperLike { get; set; } = false;
    }

    public class SwipeResponseDto
    {
        public bool Success { get; set; }
        public bool IsMatch { get; set; }
        public MatchDto? Match { get; set; }
    }

    public class MatchDto
    {
        public int Id { get; set; }
        public ProfileDto MatchedUser { get; set; } = new();
        public DateTime MatchedAt { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public bool IsRead { get; set; }
        public bool IsMine { get; set; }
    }

    public class SendMessageDto
    {
        [Required]
        public int MatchId { get; set; }

        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;
    }

    public class UserStatsDto
    {
        public int TotalLikesReceived { get; set; }
        public int TotalMatches { get; set; }
        public int ActiveConversations { get; set; }
        public int ProfileViews { get; set; }
    }
}
