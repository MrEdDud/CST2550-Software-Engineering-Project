//// user account - login credentials and timestamps
//using System.ComponentModel.DataAnnotations;

//namespace CST2550Project.Models
//{
//    public class User
//    {
//        public int Id { get; set; }

//        [Required]
//        [StringLength(50)]
//        public string Username { get; set; } = string.Empty;

//        [Required]
//        [EmailAddress]
//        public string Email { get; set; } = string.Empty;

//        [Required]
//        public string PasswordHash { get; set; } = string.Empty;

//        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

//        public DateTime LastActive { get; set; } = DateTime.UtcNow;

//        public bool IsActive { get; set; } = true;

//        public Profile? Profile { get; set; }
//    }
//}
