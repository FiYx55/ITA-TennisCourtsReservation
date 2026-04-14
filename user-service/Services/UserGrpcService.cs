using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Models;
using UserService.Protos;

namespace UserService.Services;

public class UserGrpcService : UserGrpc.UserGrpcBase
{
    private readonly UserDbContext _db;
    private readonly ILogger<UserGrpcService> _logger;

    public UserGrpcService(UserDbContext db, ILogger<UserGrpcService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override async Task<GetUsersResponse> GetUsers(GetUsersRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting all users");

        var users = await _db.Users.ToListAsync();
        var response = new GetUsersResponse();
        response.Users.AddRange(users.Select(MapToResponse));

        _logger.LogInformation("Returned {Count} users", users.Count);
        return response;
    }

    public override async Task<UserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting user with ID {UserId}", request.Id);

        if (!Guid.TryParse(request.Id, out var id))
        {
            _logger.LogWarning("Invalid user ID format: {UserId}", request.Id);
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user ID format"));
        }

        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            _logger.LogWarning("User not found: {UserId}", request.Id);
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }

        _logger.LogInformation("Found user: {Email}", user.Email);
        return MapToResponse(user);
    }

    public override async Task<UserResponse> CreateUser(CreateUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Creating user with email {Email}", request.Email);

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            _logger.LogWarning("Validation failed: all fields are required");
            throw new RpcException(new Status(StatusCode.InvalidArgument, "All fields are required"));
        }

        var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (existingUser is not null)
        {
            _logger.LogWarning("Email already exists: {Email}", request.Email);
            throw new RpcException(new Status(StatusCode.AlreadyExists, "Email already exists"));
        }

        var user = new User
        {
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User created successfully: {UserId}", user.Id);
        return MapToResponse(user);
    }

    public override async Task<UserResponse> UpdateUser(UpdateUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Updating user {UserId}", request.Id);

        if (!Guid.TryParse(request.Id, out var id))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user ID format"));
        }

        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            _logger.LogWarning("User not found for update: {UserId}", request.Id);
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
        {
            var emailTaken = await _db.Users.AnyAsync(u => u.Email == request.Email && u.Id != id);
            if (emailTaken)
            {
                _logger.LogWarning("Email already taken: {Email}", request.Email);
                throw new RpcException(new Status(StatusCode.AlreadyExists, "Email already taken"));
            }
            user.Email = request.Email;
        }

        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName;
        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName;

        await _db.SaveChangesAsync();

        _logger.LogInformation("User updated successfully: {UserId}", user.Id);
        return MapToResponse(user);
    }

    public override async Task<DeleteUserResponse> DeleteUser(DeleteUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Deleting user {UserId}", request.Id);

        if (!Guid.TryParse(request.Id, out var id))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid user ID format"));
        }

        var user = await _db.Users.FindAsync(id);
        if (user is null)
        {
            _logger.LogWarning("User not found for deletion: {UserId}", request.Id);
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogInformation("User deleted successfully: {UserId}", request.Id);
        return new DeleteUserResponse { Success = true };
    }

    public override async Task<VerifyUserResponse> VerifyUser(VerifyUserRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Verifying user with email {Email}", request.Email);

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user is null || !user.IsActive)
        {
            _logger.LogWarning("Verification failed: user not found or inactive for email {Email}", request.Email);
            return new VerifyUserResponse { Valid = false, UserId = "" };
        }

        var valid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        _logger.LogInformation("Verification result for {Email}: {Valid}", request.Email, valid);
        return new VerifyUserResponse
        {
            Valid = valid,
            UserId = valid ? user.Id.ToString() : ""
        };
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        Id = user.Id.ToString(),
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        CreatedAt = user.CreatedAt.ToString("o"),
        IsActive = user.IsActive,
        Role = user.Role
    };
}
