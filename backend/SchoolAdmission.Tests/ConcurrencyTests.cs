using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using SchoolAdmission.Api.DTOs;
using Xunit;

namespace SchoolAdmission.Tests;

public class ConcurrencyTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public ConcurrencyTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ConcurrencyTest_MultipleSimultaneousRequests_NeverOverbooksSeats()
    {
        var client = _factory.CreateClient();

        // 1. Create a class with strictly 5 seats
        const int totalSeats = 5;
        const int totalApplicants = 30;

        var classRes = await client.PostAsJsonAsync("/classes", new CreateClassRequest("Class 6 - High Demand", totalSeats));
        Assert.Equal(HttpStatusCode.Created, classRes.StatusCode);
        var created = await classRes.Content.ReadFromJsonAsync<CreateClassResponse>();
        Assert.NotNull(created);

        // 2. Prepare 30 concurrent applicants with distinct 17-digit IDs
        var results = new ConcurrentBag<HttpStatusCode>();

        var tasks = Enumerable.Range(1, totalApplicants).Select(async i =>
        {
            var studentId = $"2015269{i:D10}"; // Valid 17-digit ID
            var req = new HttpRequestMessage(HttpMethod.Post, $"/classes/{created.Id}/holds");
            req.Headers.Add("X-Student-Id", studentId);

            var res = await client.SendAsync(req);
            results.Add(res.StatusCode);
        });

        // 3. Fire all requests concurrently
        await Task.WhenAll(tasks);

        // 4. Verify outcomes
        var successCount = results.Count(code => code == HttpStatusCode.Created);
        var conflictCount = results.Count(code => code == HttpStatusCode.Conflict);

        Assert.Equal(totalSeats, successCount);
        Assert.Equal(totalApplicants - totalSeats, conflictCount);

        // 5. Verify the class seat count reflects exactly 0 available and 5 held
        var classDetail = await client.GetFromJsonAsync<ClassDetailResponse>($"/classes/{created.Id}");
        Assert.NotNull(classDetail);
        Assert.Equal(totalSeats, classDetail.HeldSeats);
        Assert.Equal(0, classDetail.AvailableSeats);
        Assert.True(classDetail.HeldSeats + classDetail.ConfirmedSeats <= totalSeats);
    }
}
