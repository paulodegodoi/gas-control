namespace GasControl.Api.Models.Gas;

public class GasPrice
{
    public string Id { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public double PricePerCubicMeter { get; set; }
    public string? CondominiumId { get; set; }
}
