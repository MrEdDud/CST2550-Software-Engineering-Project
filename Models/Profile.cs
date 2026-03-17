// user profile - personal info, appearance, preferences
using System.ComponentModel.DataAnnotations;

namespace CST2550Project.Models
{
    public class ProfileModel
    {
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public int Age { get; set; }
        public string Bio { get; set; } = "";
        public string ProfilePhotoUrl { get; set; } = "";
    }
}
