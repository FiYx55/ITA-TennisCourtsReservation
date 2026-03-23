using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UserService.Data;
using UserService.Models;
using UserService.Protos;
using UserService.Services;
using UserService.Tests.Helpers;

namespace UserService.Tests;

public class UserGrpcServiceTests : IDisposable
{
    private readonly UserDbContext _db;
    private readonly UserGrpcService _service;
    private readonly ServerCallContext _context;

    public UserGrpcServiceTests()
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new UserDbContext(options);
        var logger = LoggerFactory.Create(b => b.AddConsole()).CreateLogger<UserGrpcService>();
        _service = new UserGrpcService(_db, logger);
        _context = TestServerCallContext.Create();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    private async Task<UserResponse> CreateTestUser(string email = "test@example.com")
    {
        return await _service.CreateUser(new CreateUserRequest
        {
            Email = email,
            FirstName = "Test",
            LastName = "User",
            Password = "password123"
        }, _context);
    }

    [Fact]
    public async Task CreateUser_ShouldReturnCreatedUser()
    {
        var response = await CreateTestUser();

        Assert.Equal("test@example.com", response.Email);
        Assert.Equal("Test", response.FirstName);
        Assert.Equal("User", response.LastName);
        Assert.True(response.IsActive);
        Assert.NotEmpty(response.Id);
    }

    [Fact]
    public async Task CreateUser_DuplicateEmail_ShouldThrowAlreadyExists()
    {
        await CreateTestUser();

        var ex = await Assert.ThrowsAsync<RpcException>(() => CreateTestUser());
        Assert.Equal(StatusCode.AlreadyExists, ex.StatusCode);
    }

    [Fact]
    public async Task CreateUser_MissingFields_ShouldThrowInvalidArgument()
    {
        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.CreateUser(new CreateUserRequest
            {
                Email = "",
                FirstName = "Test",
                LastName = "User",
                Password = "pass"
            }, _context));

        Assert.Equal(StatusCode.InvalidArgument, ex.StatusCode);
    }

    [Fact]
    public async Task GetUser_ShouldReturnUser()
    {
        var created = await CreateTestUser();

        var response = await _service.GetUser(new GetUserRequest { Id = created.Id }, _context);

        Assert.Equal(created.Id, response.Id);
        Assert.Equal("test@example.com", response.Email);
    }

    [Fact]
    public async Task GetUser_NotFound_ShouldThrow()
    {
        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.GetUser(new GetUserRequest { Id = Guid.NewGuid().ToString() }, _context));

        Assert.Equal(StatusCode.NotFound, ex.StatusCode);
    }

    [Fact]
    public async Task GetUser_InvalidId_ShouldThrowInvalidArgument()
    {
        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.GetUser(new GetUserRequest { Id = "not-a-guid" }, _context));

        Assert.Equal(StatusCode.InvalidArgument, ex.StatusCode);
    }

    [Fact]
    public async Task GetUsers_ShouldReturnAllUsers()
    {
        await CreateTestUser("user1@example.com");
        await CreateTestUser("user2@example.com");

        var response = await _service.GetUsers(new GetUsersRequest(), _context);

        Assert.Equal(2, response.Users.Count);
    }

    [Fact]
    public async Task UpdateUser_ShouldUpdateFields()
    {
        var created = await CreateTestUser();

        var response = await _service.UpdateUser(new UpdateUserRequest
        {
            Id = created.Id,
            Email = "updated@example.com",
            FirstName = "Updated",
            LastName = "Name"
        }, _context);

        Assert.Equal("updated@example.com", response.Email);
        Assert.Equal("Updated", response.FirstName);
        Assert.Equal("Name", response.LastName);
    }

    [Fact]
    public async Task UpdateUser_NotFound_ShouldThrow()
    {
        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.UpdateUser(new UpdateUserRequest
            {
                Id = Guid.NewGuid().ToString(),
                FirstName = "Test"
            }, _context));

        Assert.Equal(StatusCode.NotFound, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteUser_ShouldDeleteUser()
    {
        var created = await CreateTestUser();

        var response = await _service.DeleteUser(new DeleteUserRequest { Id = created.Id }, _context);

        Assert.True(response.Success);

        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.GetUser(new GetUserRequest { Id = created.Id }, _context));
        Assert.Equal(StatusCode.NotFound, ex.StatusCode);
    }

    [Fact]
    public async Task DeleteUser_NotFound_ShouldThrow()
    {
        var ex = await Assert.ThrowsAsync<RpcException>(() =>
            _service.DeleteUser(new DeleteUserRequest { Id = Guid.NewGuid().ToString() }, _context));

        Assert.Equal(StatusCode.NotFound, ex.StatusCode);
    }

    [Fact]
    public async Task VerifyUser_ValidCredentials_ShouldReturnValid()
    {
        var created = await CreateTestUser();

        var response = await _service.VerifyUser(new VerifyUserRequest
        {
            Email = "test@example.com",
            Password = "password123"
        }, _context);

        Assert.True(response.Valid);
        Assert.Equal(created.Id, response.UserId);
    }

    [Fact]
    public async Task VerifyUser_WrongPassword_ShouldReturnInvalid()
    {
        await CreateTestUser();

        var response = await _service.VerifyUser(new VerifyUserRequest
        {
            Email = "test@example.com",
            Password = "wrongpassword"
        }, _context);

        Assert.False(response.Valid);
        Assert.Empty(response.UserId);
    }

    [Fact]
    public async Task VerifyUser_NonexistentEmail_ShouldReturnInvalid()
    {
        var response = await _service.VerifyUser(new VerifyUserRequest
        {
            Email = "nobody@example.com",
            Password = "password123"
        }, _context);

        Assert.False(response.Valid);
        Assert.Empty(response.UserId);
    }
}
