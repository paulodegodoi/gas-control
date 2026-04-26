using System.Globalization;
using GasControl.Api.Models.Finance;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace GasControl.Api.Services;

public static class FinancePdfGenerator
{
    private static readonly string[] Months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    private static readonly CultureInfo Culture = new CultureInfo("pt-BR");

    public static byte[] GeneratePdf(List<FinanceCategory> categories, int year)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily(Fonts.Arial));

                page.Header().Element(x => ComposeHeader(x, year));
                page.Content().Element(x => ComposeContent(x, categories));
                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, int year)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Text($"Dashboard Financeiro - {year}").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                column.Item().Text($"Relatório gerado em: {DateTime.Now.ToString("dd/MM/yyyy HH:mm", Culture)}").FontSize(10).FontColor(Colors.Grey.Medium);
            });
        });
    }

    private static void ComposeContent(IContainer container, List<FinanceCategory> categories)
    {
        container.PaddingVertical(1, Unit.Centimetre).Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.RelativeColumn(3); // Categoria
                for (int i = 0; i < 12; i++)
                    columns.RelativeColumn(1); // Mês
                columns.RelativeColumn(1.5f); // Total Anual
            });

            table.Header(header =>
            {
                header.Cell().Element(HeaderCellStyle).Text("Categoria").SemiBold();
                foreach (var month in Months)
                {
                    header.Cell().Element(HeaderCellStyle).AlignRight().Text(month).SemiBold();
                }
                header.Cell().Element(HeaderCellStyle).AlignRight().Text("Total Anual").SemiBold();

                static IContainer HeaderCellStyle(IContainer container)
                {
                    return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                }
            });

            decimal[] totalByMonth = new decimal[12];
            decimal grandTotal = 0;

            foreach (var category in categories)
            {
                decimal categoryTotal = 0;
                decimal[] catMonthlyTotals = new decimal[12];

                for (int i = 0; i < 12; i++)
                {
                    decimal monthSum = category.BaseValues[i] + (category.SubCategories?.Sum(s => s.Values[i]) ?? 0);
                    catMonthlyTotals[i] = monthSum;
                    categoryTotal += monthSum;
                    
                    totalByMonth[i] += monthSum;
                }
                grandTotal += categoryTotal;

                table.Cell().Element(CategoryCellStyle).Text(category.Name).SemiBold();
                for (int i = 0; i < 12; i++)
                {
                    table.Cell().Element(CategoryCellStyle).AlignRight().Text(catMonthlyTotals[i].ToString()).SemiBold();
                }
                table.Cell().Element(CategoryCellStyle).AlignRight().Text(categoryTotal.ToString("C2", Culture)).SemiBold();

                if (category.SubCategories != null && category.SubCategories.Any())
                {
                    foreach (var sub in category.SubCategories)
                    {
                        decimal subTotal = 0;
                        for (int i = 0; i < 12; i++)
                        {
                            subTotal += sub.Values[i];
                        }

                        table.Cell().Element(SubCategoryCellStyle).Text($"  • {sub.Name}");
                        for (int i = 0; i < 12; i++)
                        {
                            table.Cell().Element(SubCategoryCellStyle).AlignRight().Text(sub.Values[i].ToString());
                        }
                        table.Cell().Element(SubCategoryCellStyle).AlignRight().Text(subTotal.ToString("C2", Culture));
                    }
                }
            }

            table.Cell().Element(TotalCellStyle).Text("TOTAL GERAL").SemiBold();
            for (int i = 0; i < 12; i++)
            {
                table.Cell().Element(TotalCellStyle).AlignRight().Text(totalByMonth[i].ToString()).SemiBold();
            }
            table.Cell().Element(TotalCellStyle).AlignRight().Text(grandTotal.ToString("C2", Culture)).SemiBold();

            static IContainer CategoryCellStyle(IContainer container)
            {
                return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
            }

            static IContainer SubCategoryCellStyle(IContainer container)
            {
                return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).Background(Colors.Grey.Lighten4).PaddingVertical(3).PaddingLeft(10);
            }
            
            static IContainer TotalCellStyle(IContainer container)
            {
                return container.BorderTop(2).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).PaddingVertical(5);
            }
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Página ");
            x.CurrentPageNumber();
            x.Span(" de ");
            x.TotalPages();
        });
    }
}
