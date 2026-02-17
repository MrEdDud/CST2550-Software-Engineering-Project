// profile endpoints - get, update, discover
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
    public class ProfilesController : ControllerBase
    {
        private readonly ProfileService _profileService;
        private readonly ILogger<ProfilesController> _logger;

        public ProfilesController(ProfileService profileService, ILogger<ProfilesController> logger)
        {
            _profileService = profileService;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<ActionResult<ProfileDto>> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var profile = await _profileService.GetProfileAsync(userId);
            if (profile == null) return NotFound(new { message = "Profile not found" });

            return Ok(profile);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProfileDto>> GetProfile(int id)
        {
            var profile = await _profileService.GetProfileByIdAsync(id);
            if (profile == null) return NotFound(new { message = "Profile not found" });

            return Ok(profile);
        }

        [HttpPut("me")]
        public async Task<ActionResult<ProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            try
            {
                var profile = await _profileService.UpdateProfileAsync(userId, dto);
                if (profile == null) return NotFound(new { message = "Profile not found" });

                return Ok(profile);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("discover")]
        public async Task<ActionResult<List<ProfileDto>>> GetDiscoveryProfiles([FromQuery] DiscoverFilterDto filter)
        {
            var userId = GetCurrentUserId();
            if (userId == 0) return Unauthorized();

            var profiles = await _profileService.GetDiscoveryProfilesAsync(userId, filter);
            return Ok(profiles);
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
