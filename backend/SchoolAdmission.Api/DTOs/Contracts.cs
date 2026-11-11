using System.ComponentModel.DataAnnotations;

namespace SchoolAdmission.Api.DTOs;

// ── Student Profile ─────────────────────────────────────────────────────────

public record RegisterStudentRequest(
    [Required, StringLength(17, MinimumLength = 17)] string BirthCertificateNo,
    [Required, StringLength(200, MinimumLength = 2)] string FullName,
    [Required] DateOnly DateOfBirth,
    [Required] string Gender,            // MALE | FEMALE | OTHER
    [Required, StringLength(200, MinimumLength = 2)] string FatherName,
    [Required, StringLength(200, MinimumLength = 2)] string MotherName,
    [Phone] string? GuardianPhone,
    string? PresentAddress
);

public record StudentProfileResponse(
    string Id,
    string BirthCertificateNo,
    string FullName,
    DateOnly DateOfBirth,
    string Gender,
    string FatherName,
    string MotherName,
    string? GuardianPhone,
    string? PresentAddress,
    DateTime CreatedAt
);

// ── Admission Session / Classes ──────────────────────────────────────────────

public record CreateClassRequest(
    [Required] string Name,
    [Range(1, 100000)] int TotalSeats
);

public record CreateClassResponse(
    string Id,
    string Name,
    int TotalSeats
);

public record ClassDetailResponse(
    string Id,
    string Name,
    int TotalSeats,
    int HeldSeats,
    int ConfirmedSeats,
    int AvailableSeats
);

// ── Seat Holds ───────────────────────────────────────────────────────────────

public record CreateHoldResponse(
    string HoldId,
    string ClassId,
    string StudentId,
    string Status,
    DateTime ExpiresAt
);

public record HoldDetailResponse(
    string HoldId,
    string ClassId,
    string Status,
    DateTime ExpiresAt
);

public record ConfirmHoldResponse(
    string HoldId,
    string Status
);

public record MeHoldResponse(
    string HoldId,
    string ClassId,
    string ClassName,
    string Status,
    DateTime ExpiresAt
);

public record ErrorResponse(
    string Message
);

// ── Admin ────────────────────────────────────────────────────────────────────

public record AdminLoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record AdminLoginResponse(
    string Token,
    string Username
);

public record AcademicClassDto(
    string Id,
    string Name
);

public record CreateAcademicClassRequest(
    [Required] string Name
);

public record AcademicShiftDto(
    string Id,
    string Name
);

public record CreateAcademicShiftRequest(
    [Required] string Name
);

public record CreateSessionRequest(
    [Required] string ClassLevelId,
    [Required] string ShiftId,
    [Range(1, 100000)] int TotalSeats
);
