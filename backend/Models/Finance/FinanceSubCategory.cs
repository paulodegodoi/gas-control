namespace GasControl.Api.Models.Finance;

public class FinanceSubCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FinanceCategoryId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    
    public decimal[] Values { get; set; } = new decimal[12];
}
