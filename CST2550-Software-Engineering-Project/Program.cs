using CST2550.Components;
using CST2550Project.Data;
using CST2550Project.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddDbContext<DatingAppContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<MatchService>();
builder.Services.AddScoped<MessageService>();
builder.Services.AddScoped<SessionService>();

builder.Services.AddControllers();

builder.Services.AddScoped(sp =>
{
    var nav = sp.GetRequiredService<NavigationManager>();
    return new HttpClient
    {
        BaseAddress = new Uri(nav.BaseUri)
    };
});

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/api/auth/login"; // redirect path if not authenticated
        options.Cookie.Name = "DatingAppAuth";
        options.Cookie.HttpOnly = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DatingAppContext>();
    db.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);
app.UseHttpsRedirection();

app.UseAntiforgery();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapStaticAssets();
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.UseStaticFiles();

app.Run();