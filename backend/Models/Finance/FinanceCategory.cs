namespace GasControl.Api.Models.Finance;

public class FinanceCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string CondominiumId { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public EFinanceCategoryType Type { get; set; } = EFinanceCategoryType.Forecast;
    
    public decimal[] BaseValues { get; set; } = new decimal[12];
    
    public List<FinanceSubCategory> SubCategories { get; set; } = new();
}
