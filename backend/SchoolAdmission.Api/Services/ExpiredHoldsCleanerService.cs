using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Services;

public class ExpiredHoldsCleanerService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredHoldsCleanerService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(10);

    public ExpiredHoldsCleanerService(IServiceProvider serviceProvider, ILogger<ExpiredHoldsCleanerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpiredHoldsCleanerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;
                var expiredHolds = await db.Holds
                    .Where(h => h.Status == HoldStatus.Held && h.ExpiresAt <= now)
                    .ToListAsync(stoppingToken);

                if (expiredHolds.Count > 0)
                {
                    foreach (var hold in expiredHolds)
                    {
                        hold.Status = HoldStatus.Expired;
                    }

                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Cleaned up {Count} expired holds.", expiredHolds.Count);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Error while cleaning up expired holds.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }
}
