using System.Data;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Services;

public interface IAdmissionService
{
    Task<CreateClassResponse> CreateClassAsync(CreateClassRequest request);
    Task<List<ClassDetailResponse>> GetAllClassesAsync();
    Task<ClassDetailResponse?> GetClassByIdAsync(string classId);
    Task<(CreateHoldResponse? Result, string? ErrorMessage, int StatusCode)> CreateHoldAsync(string classId, string studentId);
    Task<HoldDetailResponse?> GetHoldByIdAsync(string holdId);
    Task<(ConfirmHoldResponse? Result, string? ErrorMessage, int StatusCode)> ConfirmHoldAsync(string holdId, string studentId);
    Task<(bool Success, string? ErrorMessage, int StatusCode)> CancelHoldAsync(string holdId, string studentId);
    Task<List<MeHoldResponse>> GetStudentHoldsAsync(string studentId);
}

public class AdmissionService : IAdmissionService
{
    private readonly AppDbContext _db;
    private readonly int _holdDurationSeconds;
    private readonly ILogger<AdmissionService> _logger;
    private static readonly SemaphoreSlim _inMemoryLock = new(1, 1);

    public AdmissionService(AppDbContext db, IConfiguration configuration, ILogger<AdmissionService> logger)
    {
        _db = db;
        _logger = logger;
        
        var envDuration = Environment.GetEnvironmentVariable("HOLD_DURATION_SECONDS");
        if (!int.TryParse(envDuration, out _holdDurationSeconds) || _holdDurationSeconds <= 0)
        {
            _holdDurationSeconds = configuration.GetValue("HoldDurationSeconds", 600);
        }
    }

    public async Task<CreateClassResponse> CreateClassAsync(CreateClassRequest request)
    {
        var classId = "c_" + Guid.NewGuid().ToString("N")[..8];
        var schoolClass = new SchoolClass
        {
            Id = classId,
            Name = request.Name.Trim(),
            TotalSeats = request.TotalSeats,
            CreatedAt = DateTime.UtcNow
        };

        _db.Classes.Add(schoolClass);
        await _db.SaveChangesAsync();

        return new CreateClassResponse(schoolClass.Id, schoolClass.Name, schoolClass.TotalSeats);
    }

    public async Task<List<ClassDetailResponse>> GetAllClassesAsync()
    {
        var now = DateTime.UtcNow;

        var classes = await _db.Classes
            .AsNoTracking()
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        var classIds = classes.Select(c => c.Id).ToList();

        var holds = await _db.Holds
            .AsNoTracking()
            .Where(h => classIds.Contains(h.ClassId))
            .ToListAsync();

        var responses = new List<ClassDetailResponse>();

        foreach (var c in classes)
        {
            var classHolds = holds.Where(h => h.ClassId == c.Id).ToList();
            var confirmed = classHolds.Count(h => h.Status == HoldStatus.Confirmed);
            var held = classHolds.Count(h => h.Status == HoldStatus.Held && h.ExpiresAt > now);
            var available = Math.Max(0, c.TotalSeats - (confirmed + held));

            responses.Add(new ClassDetailResponse(
                c.Id,
                c.Name,
                c.TotalSeats,
                held,
                confirmed,
                available
            ));
        }

        return responses;
    }

    public async Task<ClassDetailResponse?> GetClassByIdAsync(string classId)
    {
        var schoolClass = await _db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId);

        if (schoolClass == null) return null;

        var now = DateTime.UtcNow;
        var holds = await _db.Holds
            .AsNoTracking()
            .Where(h => h.ClassId == classId)
            .ToListAsync();

        var confirmed = holds.Count(h => h.Status == HoldStatus.Confirmed);
        var held = holds.Count(h => h.Status == HoldStatus.Held && h.ExpiresAt > now);
        var available = Math.Max(0, schoolClass.TotalSeats - (confirmed + held));

        return new ClassDetailResponse(
            schoolClass.Id,
            schoolClass.Name,
            schoolClass.TotalSeats,
            held,
            confirmed,
            available
        );
    }

    public async Task<(CreateHoldResponse? Result, string? ErrorMessage, int StatusCode)> CreateHoldAsync(string classId, string studentId)
    {
        var isPostgres = _db.Database.IsNpgsql();

        if (isPostgres)
        {
            using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted);
            try
            {
                // Lock the class row to strictly serialize concurrent seat checks across any instances
                var lockedClass = await _db.Classes
                    .FromSqlRaw("SELECT * FROM classes WHERE \"Id\" = {0} FOR UPDATE", classId)
                    .FirstOrDefaultAsync();

                if (lockedClass == null)
                {
                    return (null, "Class not found", StatusCodes.Status404NotFound);
                }

                var now = DateTime.UtcNow;

                // Rule 3: Check if student already has active hold or confirmed admission in this class
                var hasActive = await _db.Holds.AnyAsync(h =>
                    h.ClassId == classId &&
                    h.StudentId == studentId &&
                    (h.Status == HoldStatus.Confirmed || (h.Status == HoldStatus.Held && h.ExpiresAt > now)));

                if (hasActive)
                {
                    return (null, "Student already has an active hold or confirmed admission for this class", StatusCodes.Status409Conflict);
                }

                // Check seat capacity
                var confirmedCount = await _db.Holds.CountAsync(h =>
                    h.ClassId == classId && h.Status == HoldStatus.Confirmed);

                var heldCount = await _db.Holds.CountAsync(h =>
                    h.ClassId == classId && h.Status == HoldStatus.Held && h.ExpiresAt > now);

                if (confirmedCount + heldCount >= lockedClass.TotalSeats)
                {
                    return (null, "No seats available in this class", StatusCodes.Status409Conflict);
                }

                var holdId = "h_" + Guid.NewGuid().ToString("N")[..8];
                var expiresAt = now.AddSeconds(_holdDurationSeconds);

                // Link to student profile if one exists for this birth cert number
                var studentProfile = await _db.Students
                    .FirstOrDefaultAsync(s => s.BirthCertificateNo == studentId);

                var newHold = new SeatHold
                {
                    Id = holdId,
                    ClassId = classId,
                    StudentId = studentId,
                    StudentProfileId = studentProfile?.Id,
                    Status = HoldStatus.Held,
                    ExpiresAt = expiresAt,
                    CreatedAt = now
                };

                _db.Holds.Add(newHold);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return (new CreateHoldResponse(newHold.Id, newHold.ClassId, newHold.StudentId, newHold.Status, newHold.ExpiresAt), null, StatusCodes.Status201Created);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating hold for class {ClassId}", classId);
                return (null, "An error occurred while reserving the seat", StatusCodes.Status500InternalServerError);
            }
        }
        else
        {
            // For in-memory database during non-postgres integration testing
            await _inMemoryLock.WaitAsync();
            try
            {
                var schoolClass = await _db.Classes.FindAsync(classId);
                if (schoolClass == null)
                {
                    return (null, "Class not found", StatusCodes.Status404NotFound);
                }

                var now = DateTime.UtcNow;

                var hasActive = await _db.Holds.AnyAsync(h =>
                    h.ClassId == classId &&
                    h.StudentId == studentId &&
                    (h.Status == HoldStatus.Confirmed || (h.Status == HoldStatus.Held && h.ExpiresAt > now)));

                if (hasActive)
                {
                    return (null, "Student already has an active hold or confirmed admission for this class", StatusCodes.Status409Conflict);
                }

                var confirmedCount = await _db.Holds.CountAsync(h =>
                    h.ClassId == classId && h.Status == HoldStatus.Confirmed);

                var heldCount = await _db.Holds.CountAsync(h =>
                    h.ClassId == classId && h.Status == HoldStatus.Held && h.ExpiresAt > now);

                if (confirmedCount + heldCount >= schoolClass.TotalSeats)
                {
                    return (null, "No seats available in this class", StatusCodes.Status409Conflict);
                }

                var holdId = "h_" + Guid.NewGuid().ToString("N")[..8];
                var expiresAt = now.AddSeconds(_holdDurationSeconds);

                var newHold = new SeatHold
                {
                    Id = holdId,
                    ClassId = classId,
                    StudentId = studentId,
                    Status = HoldStatus.Held,
                    ExpiresAt = expiresAt,
                    CreatedAt = now
                };

                _db.Holds.Add(newHold);
                await _db.SaveChangesAsync();

                return (new CreateHoldResponse(newHold.Id, newHold.ClassId, newHold.StudentId, newHold.Status, newHold.ExpiresAt), null, StatusCodes.Status201Created);
            }
            finally
            {
                _inMemoryLock.Release();
            }
        }
    }

    public async Task<HoldDetailResponse?> GetHoldByIdAsync(string holdId)
    {
        var hold = await _db.Holds
            .AsNoTracking()
            .FirstOrDefaultAsync(h => h.Id == holdId);

        if (hold == null) return null;

        var status = ResolveHoldStatus(hold);

        return new HoldDetailResponse(
            hold.Id,
            hold.ClassId,
            status,
            hold.ExpiresAt
        );
    }

    public async Task<(ConfirmHoldResponse? Result, string? ErrorMessage, int StatusCode)> ConfirmHoldAsync(string holdId, string studentId)
    {
        var hold = await _db.Holds.FirstOrDefaultAsync(h => h.Id == holdId);
        if (hold == null)
        {
            return (null, "Hold not found", StatusCodes.Status404NotFound);
        }

        // Rule 4: Only student's own hold can be confirmed
        if (!string.Equals(hold.StudentId, studentId, StringComparison.OrdinalIgnoreCase))
        {
            return (null, "Hold does not belong to this student", StatusCodes.Status403Forbidden);
        }

        // Rule 5: Idempotent confirmation
        if (hold.Status == HoldStatus.Confirmed)
        {
            return (new ConfirmHoldResponse(hold.Id, HoldStatus.Confirmed), null, StatusCodes.Status200OK);
        }

        // Rule 4: Must not be expired and must be in HELD status
        var now = DateTime.UtcNow;
        if (hold.Status != HoldStatus.Held || hold.ExpiresAt <= now)
        {
            if (hold.Status == HoldStatus.Held)
            {
                hold.Status = HoldStatus.Expired;
                await _db.SaveChangesAsync();
            }
            return (null, "Hold has expired or is invalid and cannot be confirmed", StatusCodes.Status400BadRequest);
        }

        hold.Status = HoldStatus.Confirmed;
        await _db.SaveChangesAsync();

        return (new ConfirmHoldResponse(hold.Id, HoldStatus.Confirmed), null, StatusCodes.Status200OK);
    }

    public async Task<(bool Success, string? ErrorMessage, int StatusCode)> CancelHoldAsync(string holdId, string studentId)
    {
        var hold = await _db.Holds.FirstOrDefaultAsync(h => h.Id == holdId);
        if (hold == null)
        {
            return (false, "Hold not found", StatusCodes.Status404NotFound);
        }

        if (!string.Equals(hold.StudentId, studentId, StringComparison.OrdinalIgnoreCase))
        {
            return (false, "Hold does not belong to this student", StatusCodes.Status403Forbidden);
        }

        if (hold.Status == HoldStatus.Confirmed)
        {
            return (false, "Confirmed admission cannot be cancelled", StatusCodes.Status400BadRequest);
        }

        hold.Status = HoldStatus.Cancelled;
        await _db.SaveChangesAsync();

        return (true, null, StatusCodes.Status204NoContent);
    }

    public async Task<List<MeHoldResponse>> GetStudentHoldsAsync(string studentId)
    {
        var holds = await _db.Holds
            .Include(h => h.Class)
            .AsNoTracking()
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

        return holds.Select(h => new MeHoldResponse(
            h.Id,
            h.ClassId,
            h.Class?.Name ?? "Unknown Class",
            ResolveHoldStatus(h),
            h.ExpiresAt
        )).ToList();
    }

    private static string ResolveHoldStatus(SeatHold hold)
    {
        if (hold.Status == HoldStatus.Held && hold.ExpiresAt <= DateTime.UtcNow)
        {
            return HoldStatus.Expired;
        }
        return hold.Status;
    }
}
