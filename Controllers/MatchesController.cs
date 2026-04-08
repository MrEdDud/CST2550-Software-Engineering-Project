// match endpoints - swipe, list matches, unmatch, likes
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
    public class MatchesController : ControllerBase
    {
        private readonly MatchService _matchService;
        private readonly ILogger<MatchesController> _logger;

        public MatchesController(MatchService matchService, ILogger<MatchesController> logger)
        {
            _matchService = matchService;
            _logger = logger;
        }

        [HttpPost("swipe")]
        public async Task<ActionResult<SwipeResultDto>> Swipe([FromBody] SwipeDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            try
            {
                var result = await _matchService.SwipeAsync(userId, dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing swipe");
                return StatusCode(500, new { message = "An error occurred" });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<MatchDto>>> GetMatches()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var matches = await _matchService.GetMatchesAsync(userId);
            return Ok(matches);
        }

        [HttpGet("likes")]
        public async Task<ActionResult<List<ProfileDto>>> GetLikesReceived()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var likes = await _matchService.GetLikesReceivedAsync(userId);
            return Ok(likes);
        }

        [HttpDelete("{matchId}")]
        public async Task<ActionResult> Unmatch(int matchId)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var success = await _matchService.UnmatchAsync(userId, matchId);
            if (!success) return NotFound(new { message = "Match not found" });

            return Ok(new { message = "Unmatched successfully" });
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
