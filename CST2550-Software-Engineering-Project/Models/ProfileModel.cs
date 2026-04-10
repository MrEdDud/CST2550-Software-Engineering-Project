using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace CST2550Project.Models
{
    public class ProfileModel
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(18, 120)]
        public int Age { get; set; }

        [StringLength(20)]
        public string Gender { get; set; } = string.Empty;

        [StringLength(20)]
        public string LookingFor { get; set; } = string.Empty;

        [StringLength(500)]
        public string Bio { get; set; } = string.Empty;

        [StringLength(100)]
        public string Location { get; set; } = string.Empty;

        [Required]
        public string ProfilePhotoUrl { get; set; } = string.Empty;

        // must be lists
        public string PhotosJson { get; set; } = "[]";

        [NotMapped]
        public List<string> Photos
        {
            get => string.IsNullOrWhiteSpace(PhotosJson) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(PhotosJson)!;
            set => PhotosJson = JsonSerializer.Serialize(value);
        }

        [StringLength(30)]
        public string HairColor { get; set; } = string.Empty;

        [StringLength(30)]
        public string SkinTone { get; set; } = string.Empty;

        [StringLength(30)]
        public string EyeColor { get; set; } = string.Empty;

        [StringLength(20)]
        public string BodyType { get; set; } = string.Empty;

        [StringLength(50)]
        public string Ethnicity { get; set; } = string.Empty;

        [Range(100, 250)]
        public int? HeightCm { get; set; }

        [StringLength(30)]
        public string Smoking { get; set; } = string.Empty;

        [StringLength(30)]
        public string Drinking { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}