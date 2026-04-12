namespace GasControl.Api.Models;

public class Condominium
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
}
