using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.DTOs;
using SchoolAdmission.Api.Models;
using Xunit;

namespace SchoolAdmission.Tests;

public class AdmissionApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AdmissionApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateClass_ReturnsCreatedClassWithDetails()
    {
        var request = new CreateClassRequest("Class 6 - Morning Shift", 120);
        var response = await _client.PostAsJsonAsync("/classes", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);
        Assert.StartsWith("c_", created.Id);
        Assert.Equal("Class 6 - Morning Shift", created.Name);
        Assert.Equal(120, created.TotalSeats);
    }

    [Fact]
    public async Task HoldSeat_And_Confirm_UpdatesSeatCountsCorrectly()
    {
        // 1. Create class with 2 seats
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 7 - Day Shift", 2));
        var createdClass = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(createdClass);

        var studentId1 = "20152691234567891";
        var studentId2 = "20152691234567892";

        // 2. Student 1 holds seat
        var holdReq1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq1.Headers.Add("X-Student-Id", studentId1);
        var holdRes1 = await _client.SendAsync(holdReq1);
        Assert.Equal(HttpStatusCode.Created, holdRes1.StatusCode);
        var hold1 = await holdRes1.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(hold1);
        Assert.Equal(HoldStatus.Held, hold1.Status);

        // Verify class status: total=2, held=1, confirmed=0, available=1
        var detailRes1 = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{createdClass.Id}");
        Assert.NotNull(detailRes1);
        Assert.Equal(1, detailRes1.HeldSeats);
        Assert.Equal(0, detailRes1.ConfirmedSeats);
        Assert.Equal(1, detailRes1.AvailableSeats);

        // 3. Confirm hold for Student 1
        var confirmReq = new HttpRequestMessage(HttpMethod.Post, $"/holds/{hold1.HoldId}/confirm");
        confirmReq.Headers.Add("X-Student-Id", studentId1);
        var confirmRes = await _client.SendAsync(confirmReq);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        var confirmed = await confirmRes.Content.ReadFromJsonAsync<ConfirmHoldResponse>();
        Assert.NotNull(confirmed);
        Assert.Equal(HoldStatus.Confirmed, confirmed.Status);

        // Verify class status: total=2, held=0, confirmed=1, available=1
        var detailRes2 = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{createdClass.Id}");
        Assert.NotNull(detailRes2);
        Assert.Equal(0, detailRes2.HeldSeats);
        Assert.Equal(1, detailRes2.ConfirmedSeats);
        Assert.Equal(1, detailRes2.AvailableSeats);

        // 4. Student 2 holds the last seat
        var holdReq2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq2.Headers.Add("X-Student-Id", studentId2);
        var holdRes2 = await _client.SendAsync(holdReq2);
        Assert.Equal(HttpStatusCode.Created, holdRes2.StatusCode);

        // Class is now full: total=2, held=1, confirmed=1, available=0
        var detailRes3 = await _client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{createdClass.Id}");
        Assert.NotNull(detailRes3);
        Assert.Equal(1, detailRes3.HeldSeats);
        Assert.Equal(1, detailRes3.ConfirmedSeats);
        Assert.Equal(0, detailRes3.AvailableSeats);

        // 5. Attempt 3rd student hold -> should return 409 Conflict
        var studentId3 = "20152691234567893";
        var holdReq3 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq3.Headers.Add("X-Student-Id", studentId3);
        var holdRes3 = await _client.SendAsync(holdReq3);
        Assert.Equal(HttpStatusCode.Conflict, holdRes3.StatusCode);
    }

    [Fact]
    public async Task CancelHold_FreesSeatForOtherStudents()
    {
        var classRes = await _client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 8 - Morning", 1));
        var createdClass = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(createdClass);

        var student1 = "20152691234567894";
        var student2 = "20152691234567895";

        // Student 1 holds the only seat
        var holdReq1 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq1.Headers.Add("X-Student-Id", student1);
        var holdRes1 = await _client.SendAsync(holdReq1);
        var hold = await holdRes1.Content.ReadFromJsonAsync<CreateHoldResponse>();
        Assert.NotNull(hold);

        // Student 2 cannot hold (409)
        var holdReq2 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq2.Headers.Add("X-Student-Id", student2);
        var holdRes2 = await _client.SendAsync(holdReq2);
        Assert.Equal(HttpStatusCode.Conflict, holdRes2.StatusCode);

        // Student 1 cancels the hold
        var cancelReq = new HttpRequestMessage(HttpMethod.Delete, $"/holds/{hold.HoldId}");
        cancelReq.Headers.Add("X-Student-Id", student1);
        var cancelRes = await _client.SendAsync(cancelReq);
        Assert.Equal(HttpStatusCode.NoContent, cancelRes.StatusCode);

        // Student 2 can now hold the seat
        var holdReq3 = new HttpRequestMessage(HttpMethod.Post, $"/classes/{createdClass.Id}/holds");
        holdReq3.Headers.Add("X-Student-Id", student2);
        var holdRes3 = await _client.SendAsync(holdReq3);
        Assert.Equal(HttpStatusCode.Created, holdRes3.StatusCode);
    }
}
