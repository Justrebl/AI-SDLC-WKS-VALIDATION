using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MusicCatalog.Api.Tests;

public class HelloEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private sealed record Hello(string Message);

    [Fact]
    public async Task Get_hello_returns_greeting()
    {
        var client = factory.CreateClient();

        var hello = await client.GetFromJsonAsync<Hello>("/api/hello");

        Assert.Equal("Hello from the Music Catalog API", hello?.Message);
    }
}