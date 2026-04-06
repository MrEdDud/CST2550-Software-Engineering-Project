// profile crud and discovery with server-side filtering
using System.Security.Cryptography;
using CST2550Project.Data;
using CST2550Project.DTOs;
using CST2550Project.Models;
using Microsoft.AspNetCore.Components.Forms;
using Microsoft.EntityFrameworkCore;

namespace CST2550Project.Services
{
    public class ProfileService
    {
        private readonly DatingAppContext _context;

        public ProfileService(DatingAppContext context)
        {
            _context = context;
        }

        public async Task<ProfileDto?> GetProfileAsync(int userId)
        {
            var profile = await _context.Profiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return null;

            return MapToDto(profile);
        }

        public async Task<ProfileDto?> GetProfileByIdAsync(int profileId)
        {
            var profile = await _context.Profiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == profileId);

            if (profile == null) return null;

            return MapToDto(profile);
        }

        public async Task<ProfileModel?> GetProfileByUserIdAsync(int userId)
        {
            return await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task<ProfileDto> CreateProfileAsync(ProfileModel model)
        {
            _context.Profiles.Add(model);
            await _context.SaveChangesAsync();

            return MapToDto(model); // return a DTO if you want
        }

        public async Task<ProfileDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var profile = await _context.Profiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return null;

            if (dto.Username != null && profile.User != null)
            {
                var trimmed = dto.Username.Trim();

                var exists = await _context.Users
                    .AnyAsync(u => u.Username == trimmed && u.Id != userId);

                if (exists)
                    throw new InvalidOperationException("Username already taken");

                profile.User.Username = trimmed;
            }

            if (dto.Name != null) profile.Name = dto.Name.Trim();
            if (dto.Age.HasValue) profile.Age = dto.Age.Value;
            if (dto.Bio != null) profile.Bio = dto.Bio.Trim();
            if (dto.Location != null) profile.Location = dto.Location.Trim();
            if (dto.ProfilePhotoUrl != null) profile.ProfilePhotoUrl = dto.ProfilePhotoUrl;
            if (dto.Photos != null) profile.Photos = dto.Photos;
            if (dto.Gender != null) profile.Gender = dto.Gender;
            if (dto.LookingFor != null) profile.LookingFor = dto.LookingFor;
            if (dto.HairColor != null) profile.HairColor = dto.HairColor;
            if (dto.SkinTone != null) profile.SkinTone = dto.SkinTone;
            if (dto.EyeColor != null) profile.EyeColor = dto.EyeColor;
            if (dto.BodyType != null) profile.BodyType = dto.BodyType;
            if (dto.Ethnicity != null) profile.Ethnicity = dto.Ethnicity;
            if (dto.HeightCm.HasValue) profile.HeightCm = dto.HeightCm.Value;
            if (dto.Smoking != null) profile.Smoking = dto.Smoking;
            if (dto.Drinking != null) profile.Drinking = dto.Drinking;

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(profile);
        }

        public async Task<string> SaveProfilePhotoAsync(int userId, IBrowserFile file, string folder = "profile")
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", folder);
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.Name)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.OpenReadStream(5 * 1024 * 1024).CopyToAsync(stream);

            // Return relative URL
            return $"/uploads/{folder}/{fileName}";
        }

        public async Task<ProfileDto?> UpdateProfilePhotoAsync(int userId, string photoUrl)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return null;

            profile.ProfilePhotoUrl = photoUrl;
            await _context.SaveChangesAsync();

            return MapToDto(profile);
        }

        public async Task<ProfileModel?> AddGalleryPhotoAsync(int userId, string photoUrl)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return null;

            profile.Photos ??= new List<string>();
            profile.Photos.Add(photoUrl);  // Updates PhotosJson automatically

            await _context.SaveChangesAsync();
            return profile; // <-- return full model for Blazor to update UI
        }

        public async Task<ProfileDto?> RemoveGalleryPhotoAsync(int userId, string photoUrl)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null) return null;

            if (profile.Photos != null && profile.Photos.Contains(photoUrl))
            {
                profile.Photos.Remove(photoUrl);
                await _context.SaveChangesAsync();
            }

            return MapToDto(profile);
        }

        public async Task<List<ProfileDto>> GetDiscoveryProfilesAsync(int userId, DiscoverFilterDto filter)
        {
            var userProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (userProfile == null)
                return new List<ProfileDto>();

            var swipedUserIds = await _context.Likes
                .Where(l => l.FromUserId == userId)
                .Select(l => l.ToUserId)
                .ToListAsync();

            var query = _context.Profiles
                .Include(p => p.User)
                .Where(p => p.UserId != userId)
                .Where(p => !swipedUserIds.Contains(p.UserId));

            var genderFilter = filter.Gender ?? userProfile.LookingFor;
            if (!string.IsNullOrWhiteSpace(genderFilter) && genderFilter != "Everyone")
            {
                query = query.Where(p => p.Gender == genderFilter);
            }

            if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
            {
                var term = filter.SearchTerm.Trim().ToLower();

                query = query.Where(p =>
                    p.Name.ToLower().Contains(term) ||
                    p.Bio.ToLower().Contains(term) ||
                    p.Location.ToLower().Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(filter.HairColor))
            {
                query = query.Where(p => p.HairColor == filter.HairColor);
            }

            if (!string.IsNullOrWhiteSpace(filter.SkinTone))
            {
                query = query.Where(p => p.SkinTone == filter.SkinTone);
            }

            if (!string.IsNullOrWhiteSpace(filter.EyeColor))
            {
                query = query.Where(p => p.EyeColor == filter.EyeColor);
            }

            if (!string.IsNullOrWhiteSpace(filter.BodyType))
            {
                query = query.Where(p => p.BodyType == filter.BodyType);
            }

            if (!string.IsNullOrWhiteSpace(filter.Ethnicity))
            {
                query = query.Where(p => p.Ethnicity == filter.Ethnicity);
            }

            if (!string.IsNullOrWhiteSpace(filter.Smoking))
            {
                query = query.Where(p => p.Smoking == filter.Smoking);
            }

            if (!string.IsNullOrWhiteSpace(filter.Drinking))
            {
                query = query.Where(p => p.Drinking == filter.Drinking);
            }

            var count = filter.Count <= 0 ? 20 : filter.Count;

            var profiles = await query
                .OrderBy(p => Guid.NewGuid())
                .Take(count)
                .ToListAsync();

            return profiles.Select(MapToDto).ToList();
        }

        public async Task<bool> LikeProfileAsync(int fromUserId, int toUserId)
        {
            // Check if already liked
            if (await _context.Likes.AnyAsync(l => l.FromUserId == fromUserId && l.ToUserId == toUserId))
                return false;

            // Save like
            _context.Likes.Add(new Like { FromUserId = fromUserId, ToUserId = toUserId, CreatedAt = DateTime.UtcNow });

            // Check for mutual like
            var mutual = await _context.Likes.FirstOrDefaultAsync(l => l.FromUserId == toUserId && l.ToUserId == fromUserId);
            if (mutual != null)
            {
                _context.Matches.Add(new Match { User1Id = fromUserId, User2Id = toUserId, MatchedAt = DateTime.UtcNow });
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeclineProfileAsync(int fromUserId, int toUserId)
        {
            if (!await _context.Likes.AnyAsync(l => l.FromUserId == fromUserId && l.ToUserId == toUserId))
            {
                _context.Likes.Add(new Like
                {
                    FromUserId = fromUserId,
                    ToUserId = toUserId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
            return true;
        }

        private ProfileDto MapToDto(ProfileModel profile)
        {
            return new ProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                Username = profile.User?.Username ?? string.Empty,
                Name = profile.Name,
                Age = profile.Age,
                Gender = profile.Gender,
                LookingFor = profile.LookingFor,
                Bio = profile.Bio,
                Location = profile.Location,
                ProfilePhotoUrl = profile.ProfilePhotoUrl,
                Photos = profile.Photos,
                HairColor = profile.HairColor,
                SkinTone = profile.SkinTone,
                EyeColor = profile.EyeColor,
                BodyType = profile.BodyType,
                Ethnicity = profile.Ethnicity,
                HeightCm = profile.HeightCm,
                Smoking = profile.Smoking,
                Drinking = profile.Drinking,
            };
        }

        public async Task<UpdateAccountDto?> GetAccountAsync(int userId)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return null;

            return new UpdateAccountDto
            {
                Username = user.Username,
                Email = user.Email
            };
        }
        private string HashPassword(string password)
        {
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(32);

            byte[] hashBytes = new byte[48];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hash, 0, hashBytes, 16, 32);

            return Convert.ToBase64String(hashBytes);
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            byte[] hashBytes = Convert.FromBase64String(storedHash);

            byte[] salt = new byte[16];
            Array.Copy(hashBytes, 0, salt, 0, 16);

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            byte[] hash = pbkdf2.GetBytes(32);

            for (int i = 0; i < 32; i++)
            {
                if (hashBytes[i + 16] != hash[i])
                    return false;
            }

            return true;
        }

        public async Task<bool> UpdateAccountAsync(int userId, UpdateAccountDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return false;

            if (!string.IsNullOrWhiteSpace(dto.Username))
                user.Username = dto.Username.Trim();

            if (!string.IsNullOrWhiteSpace(dto.Email))
                user.Email = dto.Email.Trim();

            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                if (!VerifyPassword(dto.CurrentPassword, user.PasswordHash))
                    throw new InvalidOperationException("Current password is incorrect.");

                user.PasswordHash = HashPassword(dto.NewPassword);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}