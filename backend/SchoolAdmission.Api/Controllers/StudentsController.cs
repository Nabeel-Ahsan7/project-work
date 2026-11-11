using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAdmission.Api.Data;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("students")]
public class StudentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentsController(AppDbContext db) => _db = db;

    // POST /students/register — create a new student profile
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterStudentRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(new ErrorResponse("Invalid registration data."));

        // Validate gender
        var validGenders = new[] { Gender.Male, Gender.Female, Gender.Other };
        if (!validGenders.Contains(req.Gender.ToUpperInvariant()))
            return BadRequest(new ErrorResponse("Gender must be MALE, FEMALE, or OTHER."));

        // Check birth certificate is exactly 17 digits
        if (!System.Text.RegularExpressions.Regex.IsMatch(req.BirthCertificateNo, @"^\d{17}$"))
            return BadRequest(new ErrorResponse("Birth certificate number must be exactly 17 digits."));

        // Duplicate check
        var exists = await _db.Students
            .AnyAsync(s => s.BirthCertificateNo == req.BirthCertificateNo);
        if (exists)
            return Conflict(new ErrorResponse("A profile with this birth certificate number already exists."));

        var student = new Student
        {
            Id = $"stu_{Guid.NewGuid():N}"[..16],
            BirthCertificateNo = req.BirthCertificateNo,
            FullName = req.FullName.Trim(),
            DateOfBirth = req.DateOfBirth,
            Gender = req.Gender.ToUpperInvariant(),
            FatherName = req.FatherName.Trim(),
            MotherName = req.MotherName.Trim(),
            GuardianPhone = req.GuardianPhone?.Trim(),
            PresentAddress = req.PresentAddress?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _db.Students.Add(student);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProfile), new { birthCertNo = student.BirthCertificateNo },
            ToResponse(student));
    }

    // GET /students/{birthCertNo} — fetch student profile by birth cert number
    [HttpGet("{birthCertNo}")]
    public async Task<IActionResult> GetProfile(string birthCertNo)
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(birthCertNo, @"^\d{17}$"))
            return BadRequest(new ErrorResponse("Birth certificate number must be exactly 17 digits."));

        var student = await _db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.BirthCertificateNo == birthCertNo);

        if (student is null)
            return NotFound(new ErrorResponse("No profile found for this birth certificate number."));

        return Ok(ToResponse(student));
    }

    private static StudentProfileResponse ToResponse(Student s) => new(
        s.Id,
        s.BirthCertificateNo,
        s.FullName,
        s.DateOfBirth,
        s.Gender,
        s.FatherName,
        s.MotherName,
        s.GuardianPhone,
        s.PresentAddress,
        s.CreatedAt
    );
}
