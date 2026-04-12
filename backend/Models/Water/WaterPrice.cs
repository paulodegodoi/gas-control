namespace GasControl.Api.Models.Water;

public class WaterPrice
{
    public string Id { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
    public double PricePerCubicMeter { get; set; }
    public string? CondominiumId { get; set; }
}
