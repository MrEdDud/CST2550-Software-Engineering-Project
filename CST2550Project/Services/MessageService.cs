// chat messaging - send, receive, read receipts, unread counts
using Microsoft.EntityFrameworkCore;
using CST2550Project.Models;
using CST2550Project.DTOs;
using CST2550Project.Data;

namespace CST2550Project.Services
{
    public class MessageService
    {
        private readonly DatingAppContext _context;

        public MessageService(DatingAppContext context)
        {
            _context = context;
        }

        public async Task<MessageDto?> SendMessageAsync(int senderId, SendMessageDto dto)
        {
            var match = await _context.Matches
                .FirstOrDefaultAsync(m => m.Id == dto.MatchId && 
                    (m.User1Id == senderId || m.User2Id == senderId) &&
                    m.IsActive);

            if (match == null) return null;

            var senderProfile = await _context.Profiles
                .FirstOrDefaultAsync(p => p.UserId == senderId);

            var message = new Message
            {
                MatchId = dto.MatchId,
                SenderId = senderId,
                Content = dto.Content
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = senderProfile?.Name ?? "Unknown",
                Content = message.Content,
                SentAt = message.SentAt,
                IsRead = false,
                IsMine = true
            };
        }

        public async Task<List<MessageDto>> GetMessagesAsync(int userId, int matchId)
        {
            var match = await _context.Matches
                .FirstOrDefaultAsync(m => m.Id == matchId && 
                    (m.User1Id == userId || m.User2Id == userId));

            if (match == null) return new List<MessageDto>();

            var messages = await _context.Messages
                .Include(m => m.Sender)
                .ThenInclude(s => s!.Profile)
                .Where(m => m.MatchId == matchId)
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            var unreadMessages = messages.Where(m => !m.IsRead && m.SenderId != userId);
            foreach (var msg in unreadMessages)
            {
                msg.IsRead = true;
            }
            await _context.SaveChangesAsync();

            return messages.Select(m => new MessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = m.Sender?.Profile?.Name ?? "Unknown",
                Content = m.Content,
                SentAt = m.SentAt,
                IsRead = m.IsRead,
                IsMine = m.SenderId == userId
            }).ToList();
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            var matchIds = await _context.Matches
                .Where(m => (m.User1Id == userId || m.User2Id == userId) && m.IsActive)
                .Select(m => m.Id)
                .ToListAsync();

            return await _context.Messages
                .Where(m => matchIds.Contains(m.MatchId) && m.SenderId != userId && !m.IsRead)
                .CountAsync();
        }

        public async Task<bool> DeleteMessageAsync(int userId, int messageId)
        {
            var message = await _context.Messages
                .FirstOrDefaultAsync(m => m.Id == messageId && m.SenderId == userId);

            if (message == null) return false;

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
