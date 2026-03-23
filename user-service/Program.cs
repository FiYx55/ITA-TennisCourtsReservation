using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Services;

var builder = WebApplication.CreateBuilder(args);

var dbHost = Environment.GetEnvironmentVariable("DATABASE_HOST") ?? "localhost";
var dbPort = Environment.GetEnvironmentVariable("DATABASE_PORT") ?? "5432";
var dbName = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "users_db";
var dbUser = Environment.GetEnvironmentVariable("DATABASE_USER") ?? "postgres";
var dbPassword = Environment.GetEnvironmentVariable("DATABASE_PASSWORD") ?? "postgres";
var grpcPort = Environment.GetEnvironmentVariable("GRPC_PORT") ?? "50051";

var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";

builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(int.Parse(grpcPort), listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2;
    });
    // HTTP/1.1 port for health checks
    options.ListenAnyIP(5050, listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1;
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("Applying database migrations...");
    db.Database.Migrate();
    logger.LogInformation("Database migrations applied successfully.");
}

app.MapGrpcService<UserGrpcService>();
app.MapGrpcReflectionService();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Logger.LogInformation("User service gRPC server listening on port {Port}", grpcPort);

app.Run();

public partial class Program { }
