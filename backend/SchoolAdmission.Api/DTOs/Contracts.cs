using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SchoolAdmission.Api.DTOs;

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
