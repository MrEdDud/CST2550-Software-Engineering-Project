using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using CST2550Project.Data;
using System.Linq;

namespace CST2550Project.Tests.IntegrationTests
{
    public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<DatingAppContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // If TEST_SQL_CONNECTION env var is set, use SQL Server for integration tests.
                // Otherwise fall back to an in-memory provider so tests can run locally without extra configuration.
                var testConn = System.Environment.GetEnvironmentVariable("TEST_SQL_CONNECTION");
                var useSql = !string.IsNullOrWhiteSpace(testConn);

                if (useSql)
                {
                    services.AddDbContext<DatingAppContext>(options =>
                    {
                        options.UseSqlServer(testConn);
                    });
                }
                else
                {
                    // Use a per-factory in-memory database name to avoid cross-test collisions
                    var inMemDbName = "IntegrationTestDb_" + System.Guid.NewGuid().ToString("N");
                    services.AddDbContext<DatingAppContext>(options =>
                    {
                        options.UseInMemoryDatabase(inMemDbName);
                    });
                }

                // Build the service provider.
                var sp = services.BuildServiceProvider();

                // Control destructive reset via TEST_SQL_ALLOW_RESET env var.
                // If TEST_SQL_ALLOW_RESET == "true" then the test factory will drop and recreate the database.
                // Otherwise it will only ensure the database exists (no destructive operations).
                var allowReset = System.Environment.GetEnvironmentVariable("TEST_SQL_ALLOW_RESET");

                using (var scope = sp.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<DatingAppContext>();
                    if (!string.IsNullOrWhiteSpace(allowReset) && allowReset.ToLower() == "true")
                    {
                        db.Database.EnsureDeleted();
                        db.Database.EnsureCreated();
                    }
                    else
                    {
                        db.Database.EnsureCreated();
                    }
                }
            });
        }
    }
}
