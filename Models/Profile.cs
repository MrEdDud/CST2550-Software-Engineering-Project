//// user profile - personal info, appearance, preferences
//using System.ComponentModel.DataAnnotations;

//namespace CST2550Project.Models
//{
//    public class Profile
//    {
//        public int Id { get; set; }

//        public int UserId { get; set; }

//        [Required]
//        [StringLength(100)]
//        public string Name { get; set; } = string.Empty;

//        [Range(18, 120)]
//        public int Age { get; set; }

//        [StringLength(20)]
//        public string Gender { get; set; } = string.Empty;

//        [StringLength(20)]
//        public string LookingFor { get; set; } = string.Empty;

//        [StringLength(500)]
//        public string Bio { get; set; } = string.Empty;

//        [StringLength(100)]
//        public string Location { get; set; } = string.Empty;

//        public string ProfilePhotoUrl { get; set; } = string.Empty;

//        public List<string> Photos { get; set; } = new();

//        public List<string> Interests { get; set; } = new();

//        [StringLength(30)]
//        public string HairColor { get; set; } = string.Empty;

//        [StringLength(30)]
//        public string SkinTone { get; set; } = string.Empty;

//        [StringLength(30)]
//        public string EyeColor { get; set; } = string.Empty;

//        [StringLength(20)]
//        public string BodyType { get; set; } = string.Empty;

//        [StringLength(50)]
//        public string Ethnicity { get; set; } = string.Empty;

//        [Range(100, 250)]
//        public int? HeightCm { get; set; }

//        [StringLength(30)]
//        public string Smoking { get; set; } = string.Empty;

//        [StringLength(30)]
//        public string Drinking { get; set; } = string.Empty;

//        [StringLength(50)]
//        public string Education { get; set; } = string.Empty;

//        [StringLength(100)]
//        public string Occupation { get; set; } = string.Empty;

//        public List<string> Hobbies { get; set; } = new();

//        [Range(18, 120)]
//        public int MinAge { get; set; } = 18;

//        [Range(18, 120)]
//        public int MaxAge { get; set; } = 100;

//        [Range(1, 500)]
//        public int MaxDistance { get; set; } = 50;

//        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

//        public User? User { get; set; }
//    }
//}
