"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData>;
}

export interface ProjectFormData {
  name: string;
  description: string;
  clientName: string;
  projectCode: string;
  status: "active" | "completed" | "on_hold" | "cancelled";
  startDate: string;
  endDate: string;
  budget: string;
  hourlyRate: string;
  color: string;
  tags: string[];
  isBillable: boolean;
}

const PROJECT_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#059669", 
  "#0891B2", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899"
];

const PROJECT_STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "text-emerald-500" },
  { value: "completed", label: "Completed", color: "text-blue-500" },
  { value: "on_hold", label: "On Hold", color: "text-yellow-500" },
  { value: "cancelled", label: "Cancelled", color: "text-red-500" },
];

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    clientName: "",
    projectCode: "",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: "",
    hourlyRate: "",
    color: "#6366F1",
    tags: [],
    isBillable: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState("");

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
      newErrors.name = "Project name is required";
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (formData.budget && parseFloat(formData.budget) < 0) {
      newErrors.budget = "Budget must be a positive number";
    }

    if (formData.hourlyRate && parseFloat(formData.hourlyRate) < 0) {
      newErrors.hourlyRate = "Hourly rate must be a positive number";
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
      clientName: "",
      projectCode: "",
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      budget: "",
      hourlyRate: "",
      color: "#6366F1",
      tags: [],
      isBillable: true,
    });
    setErrors({});
    setNewTag("");
    onClose();
  };

  const updateFormData = (field: keyof ProjectFormData, value: string | number | boolean | string[]) => {
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

  const generateProjectCode = () => {
    const clientCode = formData.clientName
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 3);
    const projectCode = formData.name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 3);
    const year = new Date().getFullYear().toString().slice(-2);
    
    updateFormData("projectCode", `${clientCode}${projectCode}${year}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">
                {initialData ? "Edit" : "Create"} Project
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Organize expenses by client projects for better tracking
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
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., Website Redesign"
                  className={`bg-gray-800 border-gray-700 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => updateFormData("clientName", e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Brief description of the project"
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>

            {/* Project Code and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectCode">Project Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="projectCode"
                    value={formData.projectCode}
                    onChange={(e) => updateFormData("projectCode", e.target.value)}
                    placeholder="e.g., ACMWR24"
                    className="bg-gray-800 border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateProjectCode}
                    className="border-gray-700"
                    disabled={!formData.name || !formData.clientName}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Unique identifier for this project
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "completed" | "on_hold" | "cancelled") => updateFormData("status", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className={status.color}>{status.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData("startDate", e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData("endDate", e.target.value)}
                  className={`bg-gray-800 border-gray-700 ${
                    errors.endDate ? "border-red-500" : ""
                  }`}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Project Budget</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => updateFormData("budget", e.target.value)}
                    placeholder="0.00"
                    className={`pl-10 bg-gray-800 border-gray-700 ${
                      errors.budget ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.budget && (
                  <p className="text-sm text-red-500">{errors.budget}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="hourlyRate"
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => updateFormData("hourlyRate", e.target.value)}
                    placeholder="0.00"
                    className={`pl-10 bg-gray-800 border-gray-700 ${
                      errors.hourlyRate ? "border-red-500" : ""
                    }`}
                  />
                </div>
                {errors.hourlyRate && (
                  <p className="text-sm text-red-500">{errors.hourlyRate}</p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="billable"
                  checked={formData.isBillable}
                  onCheckedChange={(checked) => updateFormData("isBillable", checked)}
                />
                <Label htmlFor="billable" className="cursor-pointer">
                  This is a billable project
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Project Color</Label>
                <div className="flex gap-2">
                  {PROJECT_COLORS.map((color) => (
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

            {/* Tags */}
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
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          <div className="border-t border-gray-800 p-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {initialData ? "Update" : "Create"} Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}