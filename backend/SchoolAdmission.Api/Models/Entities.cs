namespace SchoolAdmission.Api.Models;

public static class Gender
{
    public const string Male   = "MALE";
    public const string Female = "FEMALE";
    public const string Other  = "OTHER";
}

public class Student
{
    public string Id { get; set; } = string.Empty;             // internal UUID-style id
    public string BirthCertificateNo { get; set; } = string.Empty; // 17-digit, unique
    public string FullName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string FatherName { get; set; } = string.Empty;
    public string MotherName { get; set; } = string.Empty;
    public string? GuardianPhone { get; set; }
    public string? PresentAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<SeatHold> Holds { get; set; } = new();
}

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

    // Birth certificate number — the natural student identifier used in headers/APIs
    public string StudentId { get; set; } = string.Empty;

    // FK to the Student profile (nullable: legacy holds before profile system)
    public string? StudentProfileId { get; set; }
    public Student? StudentProfile { get; set; }

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
