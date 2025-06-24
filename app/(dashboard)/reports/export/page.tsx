"use client";

import { useState } from "react";
import { FileDown, FileText, Calculator, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { generateClientSidePdf } from "@/lib/services/pdf-generator";
import { useTransactions } from "@/contexts/transactions";
import { useCategories } from "@/contexts/categories";

interface ExportOptions {
  format: 'csv' | 'pdf' | 'tax';
  dateRange: {
    start: string;
    end: string;
  };
  includeCategories: boolean;
  includeCharts: boolean;
  title?: string;
  taxYear?: number;
}

export default function DataExportPage() {
  const { toast } = useToast();
  const { transactions } = useTransactions();
  const { data: categories } = useCategories();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeCategories: true,
    includeCharts: true,
    title: 'Financial Report',
    taxYear: new Date().getFullYear()
  });

  const handleExport = async (format: 'csv' | 'pdf' | 'tax') => {
    setIsExporting(true);
    
    try {
      const endpoint = `/api/export/${format}`;
      const requestBody = format === 'tax' 
        ? { taxYear: exportOptions.taxYear, dateRange: exportOptions.dateRange }
        : {
            dateRange: exportOptions.dateRange,
            includeCategories: exportOptions.includeCategories,
            ...(format === 'pdf' && {
              title: exportOptions.title,
              includeCharts: exportOptions.includeCharts
            })
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      if (format === 'tax') {
        // Tax report returns JSON data
        const taxData = await response.json();
        
        // Create a downloadable JSON file
        const blob = new Blob([JSON.stringify(taxData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${exportOptions.taxYear}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Tax Report Generated",
          description: `Tax report for ${exportOptions.taxYear} has been downloaded.`,
        });
      } else if (format === 'pdf') {
        // Generate PDF client-side
        if (!transactions || !categories) {
          throw new Error('Transaction or category data not available');
        }

        // Apply date range filter
        const filteredTransactions = transactions.filter(t => {
          const transactionDate = t.transactionDate;
          return transactionDate >= exportOptions.dateRange.start && 
                 transactionDate <= exportOptions.dateRange.end;
        });

        // Convert categories to export format
        const exportCategories = categories.map(cat => ({
          id: cat.id!,
          name: cat.name,
          type: 'expense' as 'income' | 'expense', // Categories in this app are primarily expense categories
          isBusinessExpense: cat.categoryType === 'business' || cat.isTaxDeductible || false
        }));

        const pdfBlob = await generateClientSidePdf(
          filteredTransactions,
          exportCategories,
          {
            title: exportOptions.title,
            dateRange: exportOptions.dateRange,
            includeCharts: exportOptions.includeCharts
          }
        );

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'financial-report.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "PDF Generated",
          description: "Your PDF report has been downloaded.",
        });
      } else {
        // CSV export via API
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transactions.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Export Successful",
          description: "Your CSV file has been downloaded.",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateRangePreset = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end = now;

    switch (preset) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        start = new Date(now.getFullYear(), 0, 1);
    }

    setExportOptions({
      ...exportOptions,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Export & Reports</h1>
          <p className="text-gray-400">
            Export your financial data and generate comprehensive reports
          </p>
        </div>
      </div>

      {/* Export Options */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Export Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={exportOptions.dateRange.start}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  dateRange: { ...exportOptions.dateRange, start: e.target.value }
                })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={exportOptions.dateRange.end}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  dateRange: { ...exportOptions.dateRange, end: e.target.value }
                })}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <Select onValueChange={handleDateRangePreset}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Choose preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tax Year</Label>
              <Input
                type="number"
                value={exportOptions.taxYear}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  taxYear: parseInt(e.target.value) || new Date().getFullYear()
                })}
                className="bg-gray-800 border-gray-700"
                min="2020"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Export Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCategories"
                checked={exportOptions.includeCategories}
                onCheckedChange={(checked) => setExportOptions({
                  ...exportOptions,
                  includeCategories: checked as boolean
                })}
              />
              <Label htmlFor="includeCategories">Include category information</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={exportOptions.includeCharts}
                onCheckedChange={(checked) => setExportOptions({
                  ...exportOptions,
                  includeCharts: checked as boolean
                })}
              />
              <Label htmlFor="includeCharts">Include charts in PDF reports</Label>
            </div>
          </div>

          {/* Report Title */}
          <div className="space-y-2">
            <Label>Report Title (for PDF reports)</Label>
            <Input
              value={exportOptions.title}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                title: e.target.value
              })}
              className="bg-gray-800 border-gray-700"
              placeholder="Enter report title"
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CSV Export */}
        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-400" />
              <CardTitle>CSV Export</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Export your transaction data in CSV format for use in spreadsheet applications
              and financial software.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Includes:</div>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                <li>All transaction details</li>
                <li>Category information</li>
                <li>Business expense flags</li>
                <li>Date range filtering</li>
              </ul>
            </div>
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </CardContent>
        </Card>

        {/* PDF Report */}
        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <CardTitle>PDF Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Generate a comprehensive PDF report with summaries, charts, and 
              professional formatting.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Includes:</div>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                <li>Executive summary</li>
                <li>Income vs expense charts</li>
                <li>Category breakdowns</li>
                <li>Custom report title</li>
              </ul>
            </div>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Generate PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Tax Report */}
        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-400" />
              <CardTitle>Tax Report</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              Generate tax-ready reports separating business and personal expenses
              with proper categorization.
            </p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Includes:</div>
              <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                <li>Business expense breakdown</li>
                <li>Personal expense summary</li>
                <li>Tax category mapping</li>
                <li>Annual totals</li>
              </ul>
            </div>
            <Button
              onClick={() => handleExport('tax')}
              disabled={isExporting}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Generate Tax Report'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Templates */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Custom Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="annual">Annual</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start border-gray-700"
                  onClick={() => {
                    handleDateRangePreset('thisMonth');
                    handleExport('pdf');
                  }}
                >
                  <div className="font-medium">This Month Summary</div>
                  <div className="text-xs text-gray-400 text-left">
                    Income, expenses, and category breakdown for current month
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start border-gray-700"
                  onClick={() => {
                    handleDateRangePreset('lastMonth');
                    handleExport('csv');
                  }}
                >
                  <div className="font-medium">Previous Month Data</div>
                  <div className="text-xs text-gray-400 text-left">
                    Detailed transaction data for the previous month
                  </div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="quarterly" className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Generate quarterly reports for business planning and tax preparation.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start border-gray-700"
                  onClick={() => handleExport('pdf')}
                >
                  <div className="font-medium">Q1 Business Report</div>
                  <div className="text-xs text-gray-400 text-left">
                    January - March business expenses and income
                  </div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="annual" className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Comprehensive annual reports perfect for tax filing and year-end analysis.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start border-gray-700"
                  onClick={() => {
                    handleDateRangePreset('thisYear');
                    handleExport('tax');
                  }}
                >
                  <div className="font-medium">Annual Tax Report</div>
                  <div className="text-xs text-gray-400 text-left">
                    Complete tax-ready report for the current year
                  </div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Create custom reports with your specific date ranges and formatting preferences.
              </div>
              <div className="text-sm text-gray-500">
                Use the export options above to customize your date range and export format,
                then choose your preferred export type.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}