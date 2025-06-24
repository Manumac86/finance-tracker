"use client";

import { UITransaction } from '@/lib/db/schemas/transaction';
import { ExportCategory, PdfReportOptions } from './data-export';

export async function generateClientSidePdf(
  transactions: UITransaction[],
  categories: ExportCategory[],
  options: PdfReportOptions
): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // Title
  const title = options.title || 'Financial Report';
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  
  // Date range
  if (options.dateRange) {
    doc.setFontSize(12);
    doc.text(`From: ${options.dateRange.start} To: ${options.dateRange.end}`, 20, 35);
  }
  
  // Summary calculations
  const totalIncome = transactions
    .filter(t => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netIncome = totalIncome - totalExpenses;
  
  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', 20, 50);
  doc.setFontSize(10);
  doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 20, 60);
  doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 20, 70);
  doc.text(`Net Income: $${netIncome.toFixed(2)}`, 20, 80);
  doc.text(`Total Transactions: ${transactions.length}`, 20, 90);
  
  // Transactions table
  const tableData = transactions.slice(0, 50).map(transaction => {
    const category = categories.find(c => c.id === transaction.categoryId);
    return [
      transaction.transactionDate,
      transaction.name,
      transaction.transactionType === 'income' ? `+$${transaction.amount.toFixed(2)}` : `-$${transaction.amount.toFixed(2)}`,
      category?.name || 'Uncategorized',
      transaction.description || ''
    ];
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    startY: 100,
    head: [['Date', 'Description', 'Amount', 'Category', 'Notes']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      2: { halign: 'right' } // Amount column
    }
  });
  
  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}