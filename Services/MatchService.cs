// swipe processing, mutual match detection, likes tracking
using Microsoft.EntityFrameworkCore;
using CST2550Project.Models;
using CST2550Project.DTOs;
using CST2550Project.Data;

namespace CST2550Project.Services
{
    public class MatchService
    {
        private readonly DatingAppContext _context;

        public MatchService(DatingAppContext context)
        {
            _context = context;
        }

        public async Task<SwipeResultDto> SwipeAsync(int userId, SwipeDto dto)
        {
            var result = new SwipeResultDto { IsMatch = false };

            if (!dto.IsLike) return result;

            var existingLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.FromUserId == userId && l.ToUserId == dto.TargetUserId);

            if (existingLike != null) return result;

            var like = new Like
            {
                FromUserId = userId,
                ToUserId = dto.TargetUserId,
                IsSuperLike = dto.IsSuperLike
            };

            _context.Likes.Add(like);
            await _context.SaveChangesAsync();

            var mutualLike = await _context.Likes
                .FirstOrDefaultAsync(l => l.FromUserId == dto.TargetUserId && l.ToUserId == userId);

            if (mutualLike != null)
            {
                var match = new Match
                {
                    User1Id = Math.Min(userId, dto.TargetUserId),
                    User2Id = Math.Max(userId, dto.TargetUserId)
                };

                _context.Matches.Add(match);
                await _context.SaveChangesAsync();

                var matchedProfile = await _context.Profiles
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.UserId == dto.TargetUserId);

                result.IsMatch = true;
                result.Match = new MatchDto
                {
                    Id = match.Id,
                    MatchedAt = match.MatchedAt,
                    MatchedUser = matchedProfile != null ? MapToProfileDto(matchedProfile) : new ProfileDto()
                };
            }

            return result;
        }

        public async Task<List<MatchDto>> GetMatchesAsync(int userId)
        {
            var matches = await _context.Matches
                .Include(m => m.Messages.OrderByDescending(msg => msg.SentAt).Take(1))
                .Include(m => m.User1) // <- added to fix "unknown user"
                .Include(m => m.User2) // <- added to fix "unknown user"
                .Where(m => m.User1Id == userId || m.User2Id == userId)
                .Where(m => m.IsActive)
                .OrderByDescending(m => m.MatchedAt)
                .ToListAsync();

            var result = new List<MatchDto>();

            foreach (var match in matches)
            {
                var matchedUserId = match.User1Id == userId ? match.User2Id : match.User1Id;
                var matchedProfile = await _context.Profiles
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.UserId == matchedUserId);

                if (matchedProfile == null) continue;

                var lastMessage = match.Messages.FirstOrDefault();
                var unreadCount = await _context.Messages
                    .Where(m => m.MatchId == match.Id && m.SenderId != userId && !m.IsRead)
                    .CountAsync();

                result.Add(new MatchDto
                {
                    Id = match.Id,
                    MatchedAt = match.MatchedAt,
                    User1Id = match.User1Id,
                    User2Id = match.User2Id,
                    User1 = new UserDto { Id = match.User1.Id, Username = match.User1.Username },
                    User2 = new UserDto { Id = match.User2.Id, Username = match.User2.Username },
                    MatchedUser = MapToProfileDto(matchedProfile),
                    LastMessage = lastMessage != null ? new MessageDto
                    {
                        Id = lastMessage.Id,
                        SenderId = lastMessage.SenderId,
                        Content = lastMessage.Content,
                        SentAt = lastMessage.SentAt,
                        IsRead = lastMessage.IsRead,
                        IsMine = lastMessage.SenderId == userId
                    } : null,
                    UnreadCount = unreadCount
                });
            }

            return result;
        }

        public async Task<bool> UnmatchAsync(int userId, int matchId)
        {
            var match = await _context.Matches
                .FirstOrDefaultAsync(m => m.Id == matchId && 
                    (m.User1Id == userId || m.User2Id == userId));

            if (match == null) return false;

            match.IsActive = false;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ProfileDto>> GetLikesReceivedAsync(int userId)
        {
            Console.WriteLine($"CurrentUserId inside service: {userId}");

            var likerIds = await _context.Likes
                .Where(l => l.ToUserId == userId)
                .Select(l => l.FromUserId)
                .ToListAsync();

            var matchedUserIds = await _context.Matches
                .Where(m => m.User1Id == userId || m.User2Id == userId)
                .Select(m => m.User1Id == userId ? m.User2Id : m.User1Id)
                .ToListAsync();

            var profiles = await _context.Profiles
                .Include(p => p.User)
                .Where(p => likerIds.Contains(p.UserId) && !matchedUserIds.Contains(p.UserId))
                .ToListAsync();

            return profiles.Select(MapToProfileDto).ToList();
        }

        public async Task<bool> AcceptMatchAsync(int currentUserId, int otherUserId)
        {
            // Add a match record if not already exists
            var exists = await _context.Matches.AnyAsync(m =>
                (m.User1Id == currentUserId && m.User2Id == otherUserId) ||
                (m.User1Id == otherUserId && m.User2Id == currentUserId));

            if (exists) return false;

            _context.Matches.Add(new Match
            {
                User1Id = currentUserId,
                User2Id = otherUserId,
                MatchedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeclineMatchAsync(int currentUserId, int otherUserId)
        {
            // Simply remove the like from Likes table
            var like = await _context.Likes
                .FirstOrDefaultAsync(l => l.FromUserId == otherUserId && l.ToUserId == currentUserId);

            if (like == null) return false;

            _context.Likes.Remove(like);
            await _context.SaveChangesAsync();
            return true;
        }

        private static ProfileDto MapToProfileDto(ProfileModel p)
        {
            return new ProfileDto
            {
                Id = p.Id,
                UserId = p.UserId,
                Username = p.User?.Username ?? string.Empty,
                Name = p.Name,
                Age = p.Age,
                Gender = p.Gender,
                LookingFor = p.LookingFor,
                Bio = p.Bio,
                Location = p.Location,
                ProfilePhotoUrl = p.ProfilePhotoUrl,
                Photos = p.Photos,
                HairColor = p.HairColor,
                SkinTone = p.SkinTone,
                EyeColor = p.EyeColor,
                BodyType = p.BodyType,
                Ethnicity = p.Ethnicity,
                HeightCm = p.HeightCm,
                Smoking = p.Smoking,
                Drinking = p.Drinking,
            };
        }
    }
}
