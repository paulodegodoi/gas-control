namespace GasControl.Api.Models.Auth;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    /// <summary>
    /// Lista de condomínios ao qual o usuário tem acesso ou pertence.
    /// Vazio (ou todos) para Admin. 1 ou mais para Síndico. 1 para Morador.
    /// Mapeado magicamente para text[] no PostgreSQL pelo EF Core 8+.
    /// </summary>
    public List<string>? CondominiumIds { get; set; } = new();

    /// <summary>
    /// Apartamento vinculado ao Morador.
    /// Preenchido apenas para usuários com Role = Morador.
    /// </summary>
    public string? ApartmentId { get; set; }
}
