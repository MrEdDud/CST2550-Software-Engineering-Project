// discovery endpoints - get filtered profiles for swiping
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
    public class DiscoveryController : ControllerBase
    {
        private readonly ProfileService _profileService;
        private readonly MatchService _matchService;
        private readonly ILogger<DiscoveryController> _logger;

        public DiscoveryController(ProfileService profileService, MatchService matchService, ILogger<DiscoveryController> logger)
        {
            _profileService = profileService;
            _matchService = matchService;
            _logger = logger;
        }

        // Get discovery profiles with filters
        // Query params: minAge, maxAge, distance, gender, hairColor, skinTone, eyeColor, bodyType, ethnicity, smoking, drinking, interests
        [HttpGet("profiles")]
        public async Task<ActionResult<List<DiscoveryProfileDto>>> GetDiscoveryProfiles([FromQuery] DiscoveryFilterDto filter)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var profiles = await _profileService.GetDiscoveryProfilesAsync(userId, filter);
                return Ok(profiles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discovery profiles");
                return StatusCode(500, new { message = "Error loading profiles" });
            }
        }

        // Swipe action (like or pass)
        [HttpPost("swipe")]
        public async Task<ActionResult<SwipeResponseDto>> Swipe([FromBody] SwipeDto dto)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == 0) return Unauthorized();

                var result = await _matchService.SwipeAsync(userId, dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing swipe");
                return StatusCode(500, new { message = "Error processing swipe" });
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null && int.TryParse(claim.Value, out var userId) ? userId : 0;
        }
    }
}
