"use client";

import { useState } from "react";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CustomBudgetRules,
  CustomBudgetRule,
  generateRuleDescription,
} from "@/lib/types/custom-budget-rules";
import { useTranslatedCategories } from "@/hooks/use-translated-categories";

interface CustomBudgetRulesProps {
  rules: CustomBudgetRules;
  onRulesChange: (rules: CustomBudgetRules) => void;
}

export function CustomBudgetRulesComponent({ rules, onRulesChange }: CustomBudgetRulesProps) {
  const { data: categories } = useTranslatedCategories();
  const [activeRuleType, setActiveRuleType] = useState<string>("amount_range");

  const addRule = (rule: CustomBudgetRule) => {
    const newRules = {
      ...rules,
      rules: [...(rules.rules || []), rule],
    };
    onRulesChange(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = {
      ...rules,
      rules: rules.rules?.filter((_, i) => i !== index) || [],
    };
    onRulesChange(newRules);
  };

  const updateOperator = (operator: "AND" | "OR") => {
    onRulesChange({ ...rules, operator });
  };

  const AmountRangeForm = () => {
    const [min, setMin] = useState("");
    const [max, setMax] = useState("");

    const handleAdd = () => {
      const rule: CustomBudgetRule = {
        type: "amount_range",
        min: min ? parseFloat(min) : undefined,
        max: max ? parseFloat(max) : undefined,
      };
      addRule(rule);
      setMin("");
      setMax("");
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-amount">Minimum Amount ($)</Label>
            <Input
              id="min-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="max-amount">Maximum Amount ($)</Label>
            <Input
              id="max-amount"
              type="number"
              step="0.01"
              placeholder="100.00"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Amount Range Rule
        </Button>
      </div>
    );
  };

  const KeywordsForm = () => {
    const [keywords, setKeywords] = useState("");
    const [matchMode, setMatchMode] = useState<"any" | "all">("any");
    const [searchIn, setSearchIn] = useState<"name" | "description" | "both">("both");
    const [caseSensitive, setCaseSensitive] = useState(false);

    const handleAdd = () => {
      const keywordList = keywords.split(",").map(k => k.trim()).filter(k => k.length > 0);
      if (keywordList.length === 0) return;

      const rule: CustomBudgetRule = {
        type: "keywords",
        keywords: keywordList,
        matchMode,
        searchIn,
        caseSensitive,
      };
      addRule(rule);
      setKeywords("");
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="keywords">Keywords (comma-separated)</Label>
          <Input
            id="keywords"
            placeholder="coffee, lunch, uber"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Match Mode</Label>
            <Select value={matchMode} onValueChange={(value: "any" | "all") => setMatchMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any keyword</SelectItem>
                <SelectItem value="all">All keywords</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Search In</Label>
            <Select value={searchIn} onValueChange={(value: "name" | "description" | "both") => setSearchIn(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Transaction name</SelectItem>
                <SelectItem value="description">Description</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="case-sensitive"
            checked={caseSensitive}
            onCheckedChange={setCaseSensitive}
          />
          <Label htmlFor="case-sensitive">Case sensitive</Label>
        </div>
        <Button onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Keywords Rule
        </Button>
      </div>
    );
  };

  const CategoriesForm = () => {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [matchMode, setMatchMode] = useState<"include" | "exclude">("include");

    const handleCategoryToggle = (categoryId: string) => {
      setSelectedCategories(prev =>
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    };

    const handleAdd = () => {
      if (selectedCategories.length === 0) return;

      const rule: CustomBudgetRule = {
        type: "categories",
        categoryIds: selectedCategories,
        matchMode,
      };
      addRule(rule);
      setSelectedCategories([]);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Match Mode</Label>
          <Select value={matchMode} onValueChange={(value: "include" | "exclude") => setMatchMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Include these categories</SelectItem>
              <SelectItem value="exclude">Exclude these categories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Categories</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
            {categories?.map((category) => (
              <div
                key={category.id}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  selectedCategories.includes(category.id!)
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
                onClick={() => handleCategoryToggle(category.id!)}
              >
                <span className="text-sm">{category.translatedName}</span>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full" disabled={selectedCategories.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Categories Rule
        </Button>
      </div>
    );
  };

  const DatePatternForm = () => {
    const [pattern, setPattern] = useState<"weekdays" | "weekends" | "month_start" | "month_end">("weekdays");

    const handleAdd = () => {
      const rule: CustomBudgetRule = {
        type: "date_pattern",
        pattern,
      };
      addRule(rule);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label>Date Pattern</Label>
          <Select value={pattern} onValueChange={(value: string) => setPattern(value as "weekdays" | "weekends" | "month_start" | "month_end")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
              <SelectItem value="weekends">Weekends (Sat-Sun)</SelectItem>
              <SelectItem value="month_start">Start of month (1st-7th)</SelectItem>
              <SelectItem value="month_end">End of month (last 7 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Date Pattern Rule
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Custom Budget Rules
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Define custom rules to automatically include or exclude transactions in this budget.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rules */}
        {rules.rules && rules.rules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Current Rules</Label>
              <Select value={rules.operator} onValueChange={updateOperator}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND</SelectItem>
                  <SelectItem value="OR">OR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              {rules.rules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <Badge variant="outline" className="mr-2">
                      {rule.type.replace("_", " ")}
                    </Badge>
                    <span className="text-sm">{generateRuleDescription({ rules: [rule], operator: "AND" })}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Rules Summary:</strong> {generateRuleDescription(rules)}
              </p>
            </div>
          </div>
        )}

        {/* Add New Rules */}
        <div>
          <Label className="text-sm font-medium">Add New Rule</Label>
          <Tabs value={activeRuleType} onValueChange={setActiveRuleType} className="mt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="amount_range">Amount</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="date_pattern">Date</TabsTrigger>
            </TabsList>
            
            <TabsContent value="amount_range" className="mt-4">
              <AmountRangeForm />
            </TabsContent>
            
            <TabsContent value="keywords" className="mt-4">
              <KeywordsForm />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-4">
              <CategoriesForm />
            </TabsContent>
            
            <TabsContent value="date_pattern" className="mt-4">
              <DatePatternForm />
            </TabsContent>
          </Tabs>
        </div>

        {/* Help Text */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>How it works:</strong> Transactions will be included in this budget only if they match your rules. 
            Use AND to require all rules to match, or OR to include transactions that match any rule.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}