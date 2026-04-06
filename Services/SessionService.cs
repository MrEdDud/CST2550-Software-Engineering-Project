using Microsoft.JSInterop;

namespace CST2550Project.Services
{
    public class SessionService
    {
        private readonly IJSRuntime _js;

        public SessionService(IJSRuntime js)
        {
            _js = js;
        }

        public int? UserId { get; private set; }
        public string? Token { get; private set; }
        public string? Username { get; private set; }
        public bool HasProfile { get; private set; }

        public bool IsLoggedIn => UserId != null;

        public async Task SetSessionAsync(int userId, string username, string token, bool hasProfile)
        {
            UserId = userId;
            Username = username;
            Token = token;
            HasProfile = hasProfile;

            await _js.InvokeVoidAsync("localStorage.setItem", "userId", userId);
            await _js.InvokeVoidAsync("localStorage.setItem", "username", username);
            await _js.InvokeVoidAsync("localStorage.setItem", "token", token);
            await _js.InvokeVoidAsync("localStorage.setItem", "hasProfile", hasProfile);
        }

        public async Task LoadSessionAsync()
        {
            var userIdStr = await _js.InvokeAsync<string>("localStorage.getItem", "userId");

            if (int.TryParse(userIdStr, out int id))
                UserId = id;

            Username = await _js.InvokeAsync<string>("localStorage.getItem", "username");
            Token = await _js.InvokeAsync<string>("localStorage.getItem", "token");

            var hasProfileStr = await _js.InvokeAsync<string>("localStorage.getItem", "hasProfile");
            HasProfile = bool.TryParse(hasProfileStr, out bool hp) && hp;
        }

        public async Task LogoutAsync()
        {
            UserId = null;
            Username = null;
            Token = null;
            HasProfile = false;

            await _js.InvokeVoidAsync("localStorage.clear");
        }
    }
}