// profile crud and discovery with server-side filtering
using Microsoft.EntityFrameworkCore;
using CST2550Project.Models;
using CST2550Project.DTOs;
using CST2550Project.Data;

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

        public async Task<ProfileDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var profile = await _context.Profiles
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null) return null;

            if (dto.Username != null && profile.User != null)
            {
                var exists = await _context.Users
                    .AnyAsync(u => u.Username == dto.Username && u.Id != userId);
                if (exists)
                    throw new InvalidOperationException("Username already taken");
                profile.User.Username = dto.Username;
            }

            if (dto.Name != null) profile.Name = dto.Name;
            if (dto.Age.HasValue) profile.Age = dto.Age.Value;
            if (dto.Bio != null) profile.Bio = dto.Bio;
            if (dto.Location != null) profile.Location = dto.Location;
            if (dto.ProfilePhotoUrl != null) profile.ProfilePhotoUrl = dto.ProfilePhotoUrl;
            if (dto.Photos != null) profile.Photos = dto.Photos;
            if (dto.Interests != null) profile.Interests = dto.Interests;
            if (dto.MinAge.HasValue) profile.MinAge = dto.MinAge.Value;
            if (dto.MaxAge.HasValue) profile.MaxAge = dto.MaxAge.Value;
            if (dto.MaxDistance.HasValue) profile.MaxDistance = dto.MaxDistance.Value;
            if (dto.LookingFor != null) profile.LookingFor = dto.LookingFor;

            if (dto.HairColor != null) profile.HairColor = dto.HairColor;
            if (dto.SkinTone != null) profile.SkinTone = dto.SkinTone;
            if (dto.EyeColor != null) profile.EyeColor = dto.EyeColor;
            if (dto.BodyType != null) profile.BodyType = dto.BodyType;
            if (dto.Ethnicity != null) profile.Ethnicity = dto.Ethnicity;
            if (dto.HeightCm.HasValue) profile.HeightCm = dto.HeightCm.Value;
            if (dto.Smoking != null) profile.Smoking = dto.Smoking;
            if (dto.Drinking != null) profile.Drinking = dto.Drinking;
            if (dto.Education != null) profile.Education = dto.Education;
            if (dto.Occupation != null) profile.Occupation = dto.Occupation;
            if (dto.Hobbies != null) profile.Hobbies = dto.Hobbies;

            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(profile);
        }

        public async Task<List<ProfileDto>> GetDiscoveryProfilesAsync(int userId, DiscoverFilterDto filter)
        {
            var userProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (userProfile == null) return new List<ProfileDto>();

            // don't show profiles the user already swiped on
            var swipedUserIds = await _context.Likes
                .Where(l => l.FromUserId == userId)
                .Select(l => l.ToUserId)
                .ToListAsync();

            var query = _context.Profiles
                .Include(p => p.User)
                .Where(p => p.UserId != userId)
                .Where(p => !swipedUserIds.Contains(p.UserId));

            var genderFilter = filter.Gender ?? userProfile.LookingFor;
            if (!string.IsNullOrEmpty(genderFilter) && genderFilter != "Everyone")
            {
                query = query.Where(p => p.Gender == genderFilter);
            }

            var minAge = filter.MinAge ?? userProfile.MinAge;
            var maxAge = filter.MaxAge ?? userProfile.MaxAge;
            query = query.Where(p => p.Age >= minAge && p.Age <= maxAge);

            if (!string.IsNullOrEmpty(filter.HairColor))
            {
                query = query.Where(p => p.HairColor == filter.HairColor);
            }

            if (!string.IsNullOrEmpty(filter.SkinTone))
            {
                query = query.Where(p => p.SkinTone == filter.SkinTone);
            }

            if (!string.IsNullOrEmpty(filter.EyeColor))
            {
                query = query.Where(p => p.EyeColor == filter.EyeColor);
            }

            if (!string.IsNullOrEmpty(filter.BodyType))
            {
                query = query.Where(p => p.BodyType == filter.BodyType);
            }

            if (!string.IsNullOrEmpty(filter.Ethnicity))
            {
                query = query.Where(p => p.Ethnicity == filter.Ethnicity);
            }

            if (!string.IsNullOrEmpty(filter.Smoking))
            {
                query = query.Where(p => p.Smoking == filter.Smoking);
            }

            if (!string.IsNullOrEmpty(filter.Drinking))
            {
                query = query.Where(p => p.Drinking == filter.Drinking);
            }

            var profiles = await query
                .OrderBy(p => Guid.NewGuid())
                .Take(filter.Count)
                .ToListAsync();

            return profiles.Select(MapToDto).ToList();
        }

        private ProfileDto MapToDto(Profile profile)
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
                Interests = profile.Interests,
                HairColor = profile.HairColor,
                SkinTone = profile.SkinTone,
                EyeColor = profile.EyeColor,
                BodyType = profile.BodyType,
                Ethnicity = profile.Ethnicity,
                HeightCm = profile.HeightCm,
                Smoking = profile.Smoking,
                Drinking = profile.Drinking,
                Education = profile.Education,
                Occupation = profile.Occupation,
                Hobbies = profile.Hobbies
            };
        }
    }
}
