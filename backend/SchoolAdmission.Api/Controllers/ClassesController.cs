using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("classes")]
public class ClassesController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public ClassesController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ErrorResponse("Class name is required."));
        }

        if (request.TotalSeats <= 0)
        {
            return BadRequest(new ErrorResponse("Total seats must be greater than zero."));
        }

        var result = await _admissionService.CreateClassAsync(request);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllClasses()
    {
        var result = await _admissionService.GetAllClassesAsync();
        return Ok(result);
    }

    [HttpGet("{classId}")]
    public async Task<IActionResult> GetClassById(string classId)
    {
        if (string.IsNullOrWhiteSpace(classId))
        {
            return BadRequest(new ErrorResponse("Invalid class ID."));
        }

        var result = await _admissionService.GetClassByIdAsync(classId);
        if (result == null)
        {
            return NotFound(new ErrorResponse("Class not found."));
        }

        return Ok(result);
    }

    [HttpPost("{classId}/holds")]
    public async Task<IActionResult> CreateHold(string classId, [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(classId))
        {
            return BadRequest(new ErrorResponse("Invalid class ID."));
        }

        if (string.IsNullOrWhiteSpace(studentId) || !Regex.IsMatch(studentId.Trim(), @"^\d{17}$"))
        {
            return BadRequest(new ErrorResponse("Header 'X-Student-Id' is required and must be a 17-digit numeric string."));
        }

        var (result, error, statusCode) = await _admissionService.CreateHoldAsync(classId, studentId.Trim());
        if (result == null)
        {
            return StatusCode(statusCode, new ErrorResponse(error ?? "Failed to create hold."));
        }

        return StatusCode(statusCode, result);
    }
}
