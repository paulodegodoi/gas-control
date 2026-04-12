using System.ComponentModel.DataAnnotations.Schema;

namespace GasControl.Api.Models.Water;

public class WaterReading
{
    public string Id { get; set; } = string.Empty;
    public string ApartmentId { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;

    [NotMapped]
    public double PreviousReading { get; set; }
    public double CurrentReading { get; set; }
}
