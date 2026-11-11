namespace SchoolAdmission.Api.Models;

public static class HoldStatus
{
    public const string Held = "HELD";
    public const string Confirmed = "CONFIRMED";
    public const string Expired = "EXPIRED";
    public const string Cancelled = "CANCELLED";
}

public class AcademicClass
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // e.g. "Class 6"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SchoolClass> Sessions { get; set; } = new();
}

public class AcademicShift
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // e.g. "Morning Shift"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SchoolClass> Sessions { get; set; } = new();
}

public class SchoolClass
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // e.g. "Class 6 - Morning Shift"
    public int TotalSeats { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Relational links to Class and Shift tables
    public string? ClassLevelId { get; set; }
    public AcademicClass? ClassLevel { get; set; }

    public string? ShiftId { get; set; }
    public AcademicShift? Shift { get; set; }

    public List<SeatHold> Holds { get; set; } = new();
}

public class SeatHold
{
    public string Id { get; set; } = string.Empty;
    public string ClassId { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Status { get; set; } = HoldStatus.Held;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public SchoolClass? Class { get; set; }
}

public class AdminUser
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
