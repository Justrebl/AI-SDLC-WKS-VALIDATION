var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/hello", () => new { message = "Hello from the Music Catalog API" });

app.Run();

// Exposed for WebApplicationFactory in integration tests.
public partial class Program;