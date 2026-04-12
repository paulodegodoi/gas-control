using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GasControl.Api.Models.Auth;
using Microsoft.IdentityModel.Tokens;

namespace GasControl.Api.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var secretKey = jwtSettings["SecretKey"]
            ?? throw new InvalidOperationException("JWT SecretKey não configurada.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("name", user.Name),
            new(ClaimTypes.Role, user.Role.ToString()),
        };

        if (user.CondominiumIds != null && user.CondominiumIds.Any())
        {
            foreach (var condoId in user.CondominiumIds)
            {
                claims.Add(new Claim("condominiumId", condoId));
            }
        }

        if (!string.IsNullOrEmpty(user.ApartmentId))
            claims.Add(new Claim("apartmentId", user.ApartmentId));

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
