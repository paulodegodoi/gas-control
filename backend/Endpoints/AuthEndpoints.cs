using GasControl.Api.Models.Auth;
using GasControl.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace GasControl.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (AppDbContext db, TokenService tokenService, LoginRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Results.Unauthorized();

            var token = tokenService.GenerateToken(user);

            return Results.Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role.ToString(),
                    condominiumIds = user.CondominiumIds,
                    apartmentId = user.ApartmentId,
                    mustChangePassword = user.MustChangePassword
                }
            });
        }).AllowAnonymous();

        group.MapPost("/refresh", async (AppDbContext db, TokenService tokenService, HttpContext httpContext) =>
        {
            var callerIdStr = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            
            if (string.IsNullOrEmpty(callerIdStr) || !Guid.TryParse(callerIdStr, out var callerIdGuid))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(callerIdGuid);
            if (user is null)
                return Results.Unauthorized();

            var token = tokenService.GenerateToken(user);

            return Results.Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role.ToString(),
                    condominiumIds = user.CondominiumIds,
                    apartmentId = user.ApartmentId,
                    mustChangePassword = user.MustChangePassword
                }
            });
        }).RequireAuthorization();

        group.MapPost("/register", async (
            AppDbContext db,
            TokenService tokenService,
            RegisterRequest request,
            HttpContext httpContext) =>
        {
            var callerRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var callerCondominiumIds = httpContext.User.FindAll("condominiumId").Select(c => c.Value).ToList();

            if (!Enum.TryParse<UserRole>(request.Role, true, out var targetRole))
                return Results.BadRequest("Role inválida. Use: Admin, Sindico ou Morador.");

            var requestedCondos = request.CondominiumIds ?? new List<string>();

            if (callerRole == nameof(UserRole.Sindico))
            {
                if (targetRole != UserRole.Morador && targetRole != UserRole.Sindico)
                    return Results.Forbid(); 

                // Sindico only allocates within their managed condominiums
                if (requestedCondos.Except(callerCondominiumIds).Any() || !requestedCondos.Any())
                    return Results.Forbid();
            }

            if (callerRole == nameof(UserRole.Morador))
                return Results.Forbid();

            var emailInUse = await db.Users.AnyAsync(u => u.Email == request.Email);
            if (emailInUse)
                return Results.Conflict(new { message = "E-mail já cadastrado." });

            var user = new User
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = targetRole,
                CondominiumIds = requestedCondos,
                ApartmentId = request.ApartmentId
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/auth/users/{user.Id}", new
            {
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role.ToString(),
                condominiumIds = user.CondominiumIds,
                apartmentId = user.ApartmentId,
                mustChangePassword = user.MustChangePassword
            });
        }).RequireAuthorization("CanWrite");

        group.MapPost("/forgot-password", async (AppDbContext db, ForgotPasswordRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user is null)
            {
                // Always return OK so we don't leak if an email exists or not
                return Results.Ok(new { message = "Se o e-mail existir, um link de recuperação foi enviado." });
            }

            var token = Guid.NewGuid().ToString();
            user.PasswordResetToken = token;
            user.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);

            await db.SaveChangesAsync();

            // Mock email sending: Log the reset URL to the console
            var resetUrl = $"http://localhost:5173/reset-password?token={token}&email={user.Email}";
            Console.WriteLine($"\n[MOCK EMAIL] Para redefinir a senha de {user.Email}, acesse o link:\n{resetUrl}\n");

            return Results.Ok(new { message = "Se o e-mail existir, um link de recuperação foi enviado.", mockLink = resetUrl });
        }).AllowAnonymous();

        group.MapPost("/reset-password", async (AppDbContext db, ResetPasswordRequest request) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordResetToken == request.Token);
            
            if (user is null || user.PasswordResetExpiry < DateTime.UtcNow)
            {
                return Results.BadRequest("Token inválido ou expirado.");
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetExpiry = null;

            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Senha alterada com sucesso." });
        }).AllowAnonymous();

        group.MapGet("/users", async (AppDbContext db, HttpContext httpContext) =>
        {
            var callerRole = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var callerCondominiumIds = httpContext.User.FindAll("condominiumId").Select(c => c.Value).ToList();

            var query = db.Users.AsQueryable();

            if (callerRole == nameof(UserRole.Sindico))
            {
                // Return only users that share at least one CondominiumId with the Sindico
                query = query.Where(u => u.CondominiumIds != null && u.CondominiumIds.Any(c => callerCondominiumIds.Contains(c)));
            }
            if (callerRole == nameof(UserRole.Morador))
            {
                return Results.Forbid();
            }

            var users = await query
                .Select(u => new
                {
                    id = u.Id,
                    name = u.Name,
                    email = u.Email,
                    role = u.Role.ToString(),
                    condominiumIds = u.CondominiumIds,
                    apartmentId = u.ApartmentId
                })
                .ToListAsync();

            return Results.Ok(users);
        }).RequireAuthorization("ReadOnly");

        group.MapPost("/change-password", async (AppDbContext db, HttpContext httpContext, ChangePasswordRequest request) =>
        {
            var callerIdStr = httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                    ?? httpContext.User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
            
            if (string.IsNullOrEmpty(callerIdStr) || !Guid.TryParse(callerIdStr, out var callerIdGuid))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(callerIdGuid);
            if (user is null)
                return Results.Unauthorized();

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.MustChangePassword = false;

            await db.SaveChangesAsync();

            return Results.Ok(new { message = "Senha alterada com sucesso." });
        }).RequireAuthorization();
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(
    string Name,
    string Email,
    string Password,
    string Role,
    List<string>? CondominiumIds,
    string? ApartmentId);

public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record ChangePasswordRequest(string NewPassword);
