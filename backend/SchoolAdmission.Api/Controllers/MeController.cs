using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public MeController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("holds")]
    public async Task<IActionResult> GetMyHolds([FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(studentId) || !Regex.IsMatch(studentId.Trim(), @"^\d{17}$"))
        {
            return BadRequest(new ErrorResponse("Header 'X-Student-Id' is required and must be a 17-digit numeric string."));
        }

        var result = await _admissionService.GetStudentHoldsAsync(studentId.Trim());
        return Ok(result);
    }
}
