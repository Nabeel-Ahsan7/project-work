using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;
using Xunit;

namespace SchoolAdmission.Tests;

public class ValidationAndRuleTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ValidationAndRuleTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Theory]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("1234567890123456")] // 16 digits
    [InlineData("123456789012345678")] // 18 digits
    [InlineData("1234567890123456a")] // contains non-digit
    public async Task InvalidStudentId_ReturnsBadRequest_Never500(string invalidId)
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 9 - Test", 10));
        var created = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);

        var request = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        if (!string.IsNullOrEmpty(invalidId))
        {
            request.Headers.Add("X-Student-Id", invalidId);
        }

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Rule3_StudentCannotHaveMultipleActiveHoldsInSameClass()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - Science", 10));
        var created = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);

        var studentId = "20152691234567899";

        // First hold succeeds
        var req1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        req1.Headers.Add("X-Student-Id", studentId);
        var res1 = await _client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Second hold by same student in same class must be rejected (409 Conflict)
        var req2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        req2.Headers.Add("X-Student-Id", studentId);
        var res2 = await _client.SendAsync(req2);
        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task Rule4_StudentCannotConfirmAnotherStudentsHold()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - Arts", 10));
        var created = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);

        var student1 = "20152691234567888";
        var student2 = "20152691234567877";

        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", student1);
        var holdRes = await _client.SendAsync(holdReq);
        var hold = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(hold);

        // Student 2 attempts to confirm Student 1's hold
        var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", student2);
        var confirmRes = await _client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }

    [Fact]
    public async Task Rule5_ConfirmIsIdempotent_DoesNotDoubleCount()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 10 - Commerce", 5));
        var created = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);

        var studentId = "20152691234567866";

        var holdReq = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
        holdReq.Headers.Add("X-Student-Id", studentId);
        var holdRes = await _client.SendAsync(holdReq);
        var hold = await holdRes.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(hold);

        // Confirm 1st time
        var confirmReq1 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq1.Headers.Add("X-Student-Id", studentId);
        var confirmRes1 = await _client.SendAsync(confirmReq1);
        Assert.Equal(HttpStatusCode.OK, confirmRes1.StatusCode);

        // Confirm 2nd time
        var confirmReq2 = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold.HoldId}/confirm");
        confirmReq2.Headers.Add("X-Student-Id", studentId);
        var confirmRes2 = await _client.SendAsync(confirmReq2);
        Assert.Equal(HttpStatusCode.OK, confirmRes2.StatusCode);

        // Check seat count: confirmedSeats must be exactly 1
        var classDetail = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{created.Id}");
        Assert.NotNull(classDetail);
        Assert.Equal(1, classDetail.ConfirmedSeats);
        Assert.Equal(4, classDetail.AvailableSeats);
    }
}
