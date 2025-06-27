"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Split, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/contexts/transactions";
import { useCategories } from "@/contexts/categories";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { EditTransactionModal } from "@/components/transactions/edit-transaction-modal";
import { toast } from "sonner";
import { 
  searchTransactions, 
  detectDuplicates, 
  validateBulkEdit, 
  validateSplitTransaction,
  type SearchFilters,
  type SplitTransaction
} from "@/lib/services/transaction-search";

export default function TransactionManagePage() {
  const { transactions, mutate } = useTransactions();
  const { data: categories } = useCategories();
  
  // Search and filter state
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [filteredTransactions, setFilteredTransactions] = useState<UITransaction[]>([]);
  
  // Selection state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  
  // Modal states
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [splitTransactionOpen, setSplitTransactionOpen] = useState(false);
  const [selectedTransactionForSplit, setSelectedTransactionForSplit] = useState<UITransaction | null>(null);
  
  // Bulk edit state
  const [bulkEditData, setBulkEditData] = useState({
    categoryId: "",
    description: "",
  });
  
  // Split transaction state
  const [splitData, setSplitData] = useState<SplitTransaction[]>([
    { amount: 0, categoryId: "", description: "" },
    { amount: 0, categoryId: "", description: "" },
  ]);
  
  // Duplicate detection
  const [duplicates, setDuplicates] = useState<Array<{ group: UITransaction[]; similarity: number }>>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  // Edit modal state
  const [editingTransaction, setEditingTransaction] = useState<UITransaction | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    if (transactions) {
      const filtered = searchTransactions(transactions, { ...filters, searchText });
      setFilteredTransactions(filtered);
      
      // Detect duplicates
      const detectedDuplicates = detectDuplicates(transactions);
      setDuplicates(detectedDuplicates);
    }
  }, [transactions, filters, searchText]);

  const handleSelectTransaction = (transactionId: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredTransactions.map(t => t.id!));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleBulkEdit = async () => {
    const transactionIds = Array.from(selectedTransactions);
    const validation = validateBulkEdit(transactionIds, bulkEditData);
    
    if (!validation.isValid) {
      alert("Validation failed: " + validation.errors.join(", "));
      return;
    }

    try {
      const response = await fetch("/api/transactions/bulk-edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionIds,
          updates: bulkEditData,
        }),
      });

      if (response.ok) {
        setBulkEditOpen(false);
        setSelectedTransactions(new Set());
        setBulkEditData({ categoryId: "", description: "" });
        // Refresh transactions would happen via SWR
      } else {
        const error = await response.json();
        alert("Error: " + error.error);
      }
    } catch (error) {
      console.error("Error updating transactions:", error);
      alert("Failed to update transactions");
    }
  };

  const handleSplitTransaction = async () => {
    if (!selectedTransactionForSplit) return;
    
    const validation = validateSplitTransaction(selectedTransactionForSplit, splitData);
    
    if (!validation.isValid) {
      alert("Validation failed: " + validation.errors.join(", "));
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${selectedTransactionForSplit.id}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splits: splitData }),
      });

      if (response.ok) {
        setSplitTransactionOpen(false);
        setSelectedTransactionForSplit(null);
        setSplitData([
          { amount: 0, categoryId: "", description: "" },
          { amount: 0, categoryId: "", description: "" },
        ]);
        // Refresh transactions would happen via SWR
      } else {
        const error = await response.json();
        alert("Error: " + error.error);
      }
    } catch (error) {
      console.error("Error splitting transaction:", error);
      alert("Failed to split transaction");
    }
  };

  const openSplitDialog = (transaction: UITransaction) => {
    setSelectedTransactionForSplit(transaction);
    const halfAmount = transaction.amount / 2;
    setSplitData([
      { amount: halfAmount, categoryId: transaction.categoryId, description: transaction.description || "" },
      { amount: halfAmount, categoryId: "", description: "" },
    ]);
    setSplitTransactionOpen(true);
  };

  const addSplitEntry = () => {
    setSplitData([...splitData, { amount: 0, categoryId: "", description: "" }]);
  };

  const removeSplitEntry = (index: number) => {
    if (splitData.length > 2) {
      setSplitData(splitData.filter((_, i) => i !== index));
    }
  };

  const updateSplitEntry = (index: number, field: keyof SplitTransaction, value: string | number) => {
    const newSplitData = [...splitData];
    newSplitData[index] = { ...newSplitData[index], [field]: value };
    setSplitData(newSplitData);
  };

  const formatCurrency = (amount: number, transactionType?: 'income' | 'expense') => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(absAmount);
    
    if (transactionType) {
      return transactionType === 'income' ? `+${formatted}` : `-${formatted}`;
    }
    
    return formatted;
  };

  const handleEditTransaction = (transaction: UITransaction) => {
    setEditingTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete transaction");
      }

      // Refresh the transactions list
      mutate();
      
      toast.success("Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };

  const selectedCount = selectedTransactions.size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Management</h1>
          <p className="text-gray-400">
            Search, filter, edit, and organize your transactions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDuplicates(!showDuplicates)}
            className="border-gray-700"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Duplicates ({duplicates.length})
          </Button>
          
          <Button 
            variant="outline" 
            className="border-gray-700"
            onClick={() => window.open('/reports/export', '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Text</Label>
              <Input
                placeholder="Search transactions..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) => setFilters({ ...filters, categoryId: value === 'all' ? undefined : value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.transactionType || "all"}
                onValueChange={(value) => setFilters({ ...filters, transactionType: value === 'all' ? undefined : (value as 'income' | 'expense') })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Amount Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ""}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="bg-gray-800 border-gray-700"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ""}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchText("");
              }}
              className="border-gray-700"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <Card className="bg-emerald-900/20 border-emerald-800">
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-emerald-300">
              {selectedCount} transaction{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-emerald-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle>Bulk Edit Transactions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={bulkEditData.categoryId}
                        onValueChange={(value) => setBulkEditData({ ...bulkEditData, categoryId: value })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id!}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={bulkEditData.description}
                        onChange={(e) => setBulkEditData({ ...bulkEditData, description: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                        placeholder="Update description"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkEdit} className="bg-emerald-600 hover:bg-emerald-700">
                        Update {selectedCount} Transaction{selectedCount !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" className="border-red-700 text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">
            Transactions ({filteredTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            Duplicates ({duplicates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction Table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transactions</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCount === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <Checkbox
                      checked={selectedTransactions.has(transaction.id!)}
                      onCheckedChange={(checked) => handleSelectTransaction(transaction.id!, checked as boolean)}
                    />
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <div className="font-medium">{transaction.name}</div>
                        <div className="text-sm text-gray-400">{transaction.transactionDate}</div>
                      </div>
                      
                      <div>
                        <div className={`font-medium ${
                          transaction.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(transaction.amount, transaction.transactionType)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {transaction.transactionType}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm">
                          {categories?.find(c => c.id === transaction.categoryId)?.name || 'Uncategorized'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {transaction.description}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSplitDialog(transaction)}
                          className="h-8 w-8 p-0"
                        >
                          <Split className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-400"
                          onClick={() => handleDeleteTransaction(transaction.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                    <p className="text-gray-400">
                      Try adjusting your search filters or search terms
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-4">
          {/* Duplicate Groups */}
          {duplicates.map((duplicateGroup, index) => (
            <Card key={index} className="bg-gray-900 border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  Duplicate Group {index + 1} 
                  <Badge variant="secondary" className="bg-yellow-900/20 text-yellow-300">
                    {Math.round(duplicateGroup.similarity * 100)}% similar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {duplicateGroup.group.map((transaction: UITransaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 p-3 rounded border border-gray-700 bg-gray-800/50"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium">{transaction.name}</div>
                          <div className="text-sm text-gray-400">{transaction.transactionDate}</div>
                        </div>
                        
                        <div>
                          <div className={`font-medium ${
                            transaction.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 truncate">
                          {transaction.description}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="border-red-700 text-red-400">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {duplicates.length === 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No duplicates found</h3>
                <p className="text-gray-400">
                  Your transactions look clean!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Split Transaction Dialog */}
      <Dialog open={splitTransactionOpen} onOpenChange={setSplitTransactionOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Split Transaction</DialogTitle>
          </DialogHeader>
          
          {selectedTransactionForSplit && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="font-medium">{selectedTransactionForSplit.name}</div>
                <div className="text-emerald-400 font-medium">
                  {formatCurrency(selectedTransactionForSplit.amount)}
                </div>
                <div className="text-sm text-gray-400">
                  {selectedTransactionForSplit.transactionDate}
                </div>
              </div>
              
              <div className="space-y-3">
                {splitData.map((split, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={split.amount}
                          onChange={(e) => updateSplitEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={split.categoryId}
                          onValueChange={(value) => updateSplitEntry(index, 'categoryId', value)}
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id!}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={split.description}
                          onChange={(e) => updateSplitEntry(index, 'description', e.target.value)}
                          className="bg-gray-800 border-gray-700"
                          placeholder="Description"
                        />
                      </div>
                    </div>
                    
                    {splitData.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSplitEntry(index)}
                        className="border-red-700 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={addSplitEntry} className="border-gray-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Split
                </Button>
                
                <div className="text-sm text-gray-400">
                  Total: {formatCurrency(splitData.reduce((sum, split) => sum + split.amount, 0))} / 
                  {formatCurrency(selectedTransactionForSplit.amount)}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
                <Button variant="outline" onClick={() => setSplitTransactionOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSplitTransaction} className="bg-emerald-600 hover:bg-emerald-700">
                  Split Transaction
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditingTransaction(null);
          mutate();
        }}
      />
    </div>
  );
}