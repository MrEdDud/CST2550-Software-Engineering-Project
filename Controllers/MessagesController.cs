// message endpoints - send, get chat history, unread count, delete
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using CST2550Project.DTOs;
using CST2550Project.Services;

namespace CST2550Project.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly MessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(MessageService messageService, ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<MessageDto>> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var message = await _messageService.SendMessageAsync(userId, dto);
            if (message == null)
            {
                return BadRequest(new { message = "Could not send message. Make sure you are matched with this user." });
            }

            return Ok(message);
        }

        [HttpGet("match/{matchId}")]
        public async Task<ActionResult<List<MessageDto>>> GetMessages(int matchId)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var messages = await _messageService.GetMessagesAsync(userId, matchId);
            return Ok(messages);
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var count = await _messageService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        [HttpDelete("{messageId}")]
        public async Task<ActionResult> DeleteMessage(int messageId)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var success = await _messageService.DeleteMessageAsync(userId, messageId);
            if (!success) return NotFound(new { message = "Message not found or you don't have permission to delete it" });

            return Ok(new { message = "Message deleted" });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return 0;
            }
            return userId;
        }
    }
}
