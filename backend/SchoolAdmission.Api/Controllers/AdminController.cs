using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest request)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == request.Username.Trim());
        if (user == null || user.PasswordHash != request.Password)
        {
            return Unauthorized(new ErrorResponse("Invalid admin username or password."));
        }

        var token = "admin_session_" + Guid.NewGuid().ToString("N");
        return Ok(new AdminLoginResponse(token, user.Username));
    }

    [HttpGet("classes-catalog")]
    public async Task<IActionResult> GetAcademicClasses()
    {
        var list = await _db.AcademicClasses
            .OrderBy(c => c.Name)
            .Select(c => new AcademicClassDto(c.Id, c.Name))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("classes-catalog")]
    public async Task<IActionResult> CreateAcademicClass([FromBody] CreateAcademicClassRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ErrorResponse("Class name is required."));
        }

        var trimmed = request.Name.Trim();
        var exists = await _db.AcademicClasses.AnyAsync(c => c.Name.ToLower() == trimmed.ToLower());
        if (exists)
        {
            return Conflict(new ErrorResponse($"Class '{trimmed}' already exists."));
        }

        var cls = new AcademicClass
        {
            Id = "cls_" + Guid.NewGuid().ToString("N")[..8],
            Name = trimmed,
            CreatedAt = DateTime.UtcNow
        };

        _db.AcademicClasses.Add(cls);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new AcademicClassDto(cls.Id, cls.Name));
    }

    [HttpGet("shifts")]
    public async Task<IActionResult> GetAcademicShifts()
    {
        var list = await _db.AcademicShifts
            .OrderBy(s => s.Name)
            .Select(s => new AcademicShiftDto(s.Id, s.Name))
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("shifts")]
    public async Task<IActionResult> CreateAcademicShift([FromBody] CreateAcademicShiftRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ErrorResponse("Shift name is required."));
        }

        var trimmed = request.Name.Trim();
        var exists = await _db.AcademicShifts.AnyAsync(s => s.Name.ToLower() == trimmed.ToLower());
        if (exists)
        {
            return Conflict(new ErrorResponse($"Shift '{trimmed}' already exists."));
        }

        var shift = new AcademicShift
        {
            Id = "shf_" + Guid.NewGuid().ToString("N")[..8],
            Name = trimmed,
            CreatedAt = DateTime.UtcNow
        };

        _db.AcademicShifts.Add(shift);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new AcademicShiftDto(shift.Id, shift.Name));
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
    {
        var academicClass = await _db.AcademicClasses.FindAsync(request.ClassLevelId);
        if (academicClass == null)
        {
            return BadRequest(new ErrorResponse("Selected Class not found."));
        }

        var shift = await _db.AcademicShifts.FindAsync(request.ShiftId);
        if (shift == null)
        {
            return BadRequest(new ErrorResponse("Selected Shift not found."));
        }

        if (request.TotalSeats <= 0)
        {
            return BadRequest(new ErrorResponse("Total seats must be greater than zero."));
        }

        var sessionName = $"{academicClass.Name} - {shift.Name}";
        var sessionId = "c_" + Guid.NewGuid().ToString("N")[..8];

        var schoolClass = new SchoolClass
        {
            Id = sessionId,
            Name = sessionName,
            TotalSeats = request.TotalSeats,
            ClassLevelId = academicClass.Id,
            ShiftId = shift.Id,
            CreatedAt = DateTime.UtcNow
        };

        _db.Classes.Add(schoolClass);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new CreateClassResponse(schoolClass.Id, schoolClass.Name, schoolClass.TotalSeats));
    }
}
