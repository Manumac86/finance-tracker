"use client";

import { useState, useEffect } from "react";
import { X, Tag, Building, Receipt, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UICategory } from "@/lib/db/schemas/category";
import { UIProject } from "@/lib/db/schemas/project";
import { getCategoryIcon, AVAILABLE_CATEGORY_ICONS } from "@/lib/utils/icons";

interface AdvancedCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: CategoryFormData) => void;
  initialData?: Partial<CategoryFormData>;
  categories?: UICategory[];
  projects?: UIProject[];
}

export interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  color: string;
  categoryType: "personal" | "business";
  parentCategoryId: string;
  isTaxDeductible: boolean;
  taxCategoryCode: string;
  businessExpenseType: string;
  tags: string[];
  projectId: string;
}

// Category icons now use Lucide React icons from the utility

const CATEGORY_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#059669", 
  "#0891B2", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"
];

const BUSINESS_EXPENSE_TYPES = [
  { value: "office_supplies", label: "Office Supplies" },
  { value: "travel", label: "Travel & Transportation" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "equipment", label: "Equipment & Hardware" },
  { value: "software", label: "Software & Subscriptions" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "professional_services", label: "Professional Services" },
  { value: "utilities", label: "Utilities" },
  { value: "rent", label: "Rent & Facilities" },
  { value: "other", label: "Other Business Expense" },
];

const TAX_CATEGORIES = [
  { code: "OFFICE", label: "Office Expenses", description: "General office supplies and equipment" },
  { code: "TRAVEL", label: "Travel Expenses", description: "Business travel and transportation" },
  { code: "MEALS", label: "Meals & Entertainment", description: "Business meals (50% deductible)" },
  { code: "AUTO", label: "Vehicle Expenses", description: "Business use of vehicle" },
  { code: "HOME", label: "Home Office", description: "Home office expenses" },
  { code: "PROF", label: "Professional Services", description: "Legal, accounting, consulting" },
  { code: "MKTG", label: "Marketing", description: "Advertising and marketing expenses" },
  { code: "UTILS", label: "Utilities", description: "Business utilities" },
  { code: "RENT", label: "Rent", description: "Office or facility rent" },
  { code: "TECH", label: "Technology", description: "Software, hardware, tech services" },
];

export function AdvancedCategoryModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories = [],
  projects = [],
}: AdvancedCategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    icon: "BarChart3",
    color: "#6366F1",
    categoryType: "personal",
    parentCategoryId: "",
    isTaxDeductible: false,
    taxCategoryCode: "",
    businessExpenseType: "",
    tags: [],
    projectId: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    }

    if (!formData.icon) {
      newErrors.icon = "Please select an icon";
    }

    if (formData.categoryType === "business" && formData.isTaxDeductible && !formData.taxCategoryCode) {
      newErrors.taxCategoryCode = "Tax category is required for tax-deductible business expenses";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      icon: "📊",
      color: "#6366F1",
      categoryType: "personal",
      parentCategoryId: "",
      isTaxDeductible: false,
      taxCategoryCode: "",
      businessExpenseType: "",
      tags: [],
      projectId: "",
    });
    setErrors({});
    setActiveTab("basic");
    setNewTag("");
    onClose();
  };

  const updateFormData = (field: keyof CategoryFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData("tags", formData.tags.filter(tag => tag !== tagToRemove));
  };

  const parentCategories = categories.filter(
    cat => !cat.parentCategoryId && cat.categoryType === formData.categoryType
  );

  const activeProjects = projects.filter(project => project.isActive);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">
                {initialData ? "Edit" : "Create"} Category
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Configure advanced categorization for better expense tracking
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="tax">Tax Settings</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        placeholder="e.g., Office Supplies"
                        className={`bg-gray-800 border-gray-700 ${
                          errors.name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateFormData("description", e.target.value)}
                        placeholder="Brief description of this category"
                        className="bg-gray-800 border-gray-700"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Category Type</Label>
                      <Select
                        value={formData.categoryType}
                        onValueChange={(value: "personal" | "business") =>
                          updateFormData("categoryType", value)
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4" />
                              Personal
                            </div>
                          </SelectItem>
                          <SelectItem value="business">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Business
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Icon *</Label>
                      <div className="grid grid-cols-6 gap-2">
                        {AVAILABLE_CATEGORY_ICONS.map((iconName) => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => updateFormData("icon", iconName)}
                            className={`p-3 rounded border-2 transition-colors flex items-center justify-center ${
                              formData.icon === iconName
                                ? "border-emerald-500 bg-emerald-900/20"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            {getCategoryIcon(iconName, "h-5 w-5")}
                          </button>
                        ))}
                      </div>
                      {errors.icon && (
                        <p className="text-sm text-red-500">{errors.icon}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {CATEGORY_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateFormData("color", color)}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              formData.color === color
                                ? "border-white scale-110"
                                : "border-gray-600"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="business" className="space-y-6 mt-6">
                {formData.categoryType === "business" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Expense Type</Label>
                      <Select
                        value={formData.businessExpenseType}
                        onValueChange={(value) => updateFormData("businessExpenseType", value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select expense type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_EXPENSE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Project Association</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) => updateFormData("projectId", value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Optional: Link to project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No Project</SelectItem>
                          {activeProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id!}>
                              {project.name}
                              {project.clientName && ` - ${project.clientName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Associate this category with a specific client project
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Business Features</h3>
                    <p className="text-gray-400">
                      Change category type to &quot;Business&quot; to access business-specific features
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tax" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="taxDeductible"
                      checked={formData.isTaxDeductible}
                      onCheckedChange={(checked) =>
                        updateFormData("isTaxDeductible", checked)
                      }
                    />
                    <Label htmlFor="taxDeductible" className="cursor-pointer">
                      This is a tax-deductible expense
                    </Label>
                  </div>

                  {formData.isTaxDeductible && (
                    <div className="space-y-2 ml-6">
                      <Label>Tax Category</Label>
                      <Select
                        value={formData.taxCategoryCode}
                        onValueChange={(value) => updateFormData("taxCategoryCode", value)}
                      >
                        <SelectTrigger className={`bg-gray-800 border-gray-700 ${
                          errors.taxCategoryCode ? "border-red-500" : ""
                        }`}>
                          <SelectValue placeholder="Select tax category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TAX_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.code} value={cat.code}>
                              <div>
                                <div className="font-medium">{cat.label}</div>
                                <div className="text-xs text-gray-500">{cat.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.taxCategoryCode && (
                        <p className="text-sm text-red-500">{errors.taxCategoryCode}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        This helps with tax preparation and deduction tracking
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-300 mb-2">
                      <Receipt className="w-4 h-4 inline mr-2" />
                      Tax Information
                    </h4>
                    <p className="text-sm text-blue-200">
                      Marking expenses as tax-deductible helps you track potential deductions.
                      Always consult with a tax professional for specific guidance.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="organization" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Parent Category</Label>
                    <Select
                      value={formData.parentCategoryId}
                      onValueChange={(value) => updateFormData("parentCategoryId", value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Optional: Select parent category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Parent Category</SelectItem>
                        {parentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Create subcategories by selecting a parent category
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="bg-gray-800 border-gray-700"
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        className="border-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeTag(tag)}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Tags help you organize and filter categories more effectively
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="border-t border-gray-800 p-6 flex justify-between">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "business", "tax", "organization"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  Previous
                </Button>
              )}
              {activeTab !== "organization" ? (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["basic", "business", "tax", "organization"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {initialData ? "Update" : "Create"} Category
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}