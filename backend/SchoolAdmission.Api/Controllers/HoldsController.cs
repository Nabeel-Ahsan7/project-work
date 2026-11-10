using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Services;

namespace SchoolAdmission.Api.Controllers;

[ApiController]
[Route("holds")]
public class HoldsController : ControllerBase
{
    private readonly IAdmissionService _admissionService;

    public HoldsController(IAdmissionService admissionService)
    {
        _admissionService = admissionService;
    }

    [HttpGet("{holdId}")]
    public async Task<IActionResult> GetHoldById(string holdId)
    {
        if (string.IsNullOrWhiteSpace(holdId))
        {
            return BadRequest(new ErrorResponse("Invalid hold ID."));
        }

        var result = await _admissionService.GetHoldByIdAsync(holdId);
        if (result == null)
        {
            return NotFound(new ErrorResponse("Hold not found."));
        }

        return Ok(result);
    }

    [HttpPost("{holdId}/confirm")]
    public async Task<IActionResult> ConfirmHold(string holdId, [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(holdId))
        {
            return BadRequest(new ErrorResponse("Invalid hold ID."));
        }

        if (string.IsNullOrWhiteSpace(studentId) || !Regex.IsMatch(studentId.Trim(), @"^\d{17}$"))
        {
            return BadRequest(new ErrorResponse("Header 'X-Student-Id' is required and must be a 17-digit numeric string."));
        }

        var (result, error, statusCode) = await _admissionService.ConfirmHoldAsync(holdId, studentId.Trim());
        if (result == null)
        {
            return StatusCode(statusCode, new ErrorResponse(error ?? "Failed to confirm hold."));
        }

        return StatusCode(statusCode, result);
    }

    [HttpDelete("{holdId}")]
    public async Task<IActionResult> CancelHold(string holdId, [FromHeader(Name = "X-Student-Id")] string? studentId)
    {
        if (string.IsNullOrWhiteSpace(holdId))
        {
            return BadRequest(new ErrorResponse("Invalid hold ID."));
        }

        if (string.IsNullOrWhiteSpace(studentId) || !Regex.IsMatch(studentId.Trim(), @"^\d{17}$"))
        {
            return BadRequest(new ErrorResponse("Header 'X-Student-Id' is required and must be a 17-digit numeric string."));
        }

        var (success, error, statusCode) = await _admissionService.CancelHoldAsync(holdId, studentId.Trim());
        if (!success)
        {
            return StatusCode(statusCode, new ErrorResponse(error ?? "Failed to cancel hold."));
        }

        return NoContent();
    }
}
