namespace GasControl.Api.Models;

public class Apartment
{
    public string Id { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    /// <summary>
    /// Identifica o condomínio ao qual este apartamento pertence.
    /// Usado pelo Global Query Filter para isolar dados por Síndico.
    /// </summary>
    public string? CondominiumId { get; set; }
}
