"use client";

import { useState } from "react";
import { Plus, Building, Home, Tag, Filter, Settings } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdvancedCategoryModal, CategoryFormData } from "@/components/categories/advanced-category-modal";
import { ProjectModal, ProjectFormData } from "@/components/projects/project-modal";
import { UICategory } from "@/lib/db/schemas/category";
import { UIProject } from "@/lib/db/schemas/project";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CategoriesPage() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<UICategory | null>(null);
  const [selectedProject, setSelectedProject] = useState<UIProject | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: categoriesData, error: categoriesError, mutate: mutateCategories } = useSWR<{
    categories: UICategory[];
  }>("/api/categories", fetcher);

  const { data: projectsData, error: projectsError, mutate: mutateProjects } = useSWR<{
    projects: UIProject[];
  }>("/api/projects", fetcher);

  const categories = categoriesData?.categories || [];
  const projects = projectsData?.projects || [];

  // Filter and search logic
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === "all" || category.categoryType === filterType;
    const matchesTab = activeTab === "all" || 
                      (activeTab === "personal" && category.categoryType === "personal") ||
                      (activeTab === "business" && category.categoryType === "business") ||
                      (activeTab === "tax" && category.isTaxDeductible);
    
    return matchesSearch && matchesType && matchesTab;
  });

  const personalCategories = categories.filter(cat => cat.categoryType === "personal");
  const businessCategories = categories.filter(cat => cat.categoryType === "business");
  const taxDeductibleCategories = categories.filter(cat => cat.isTaxDeductible);
  const parentCategories = categories.filter(cat => !cat.parentCategoryId);
  const subCategories = categories.filter(cat => cat.parentCategoryId);

  const handleCreateCategory = async (formData: CategoryFormData) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateCategories();
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdateCategory = async (formData: CategoryFormData) => {
    if (!selectedCategory?.id) return;

    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateCategories();
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutateCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleCreateProject = async (formData: ProjectFormData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateProjects();
      }
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleUpdateProject = async (formData: ProjectFormData) => {
    if (!selectedProject?.id) return;

    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateProjects();
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const isLoading = !categoriesData || !projectsData;
  const hasError = categoriesError || projectsError;

  if (hasError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading data. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories & Projects</h1>
          <p className="text-gray-400">
            Organize expenses with advanced categorization and project tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedProject(null);
              setIsProjectModalOpen(true);
            }}
            variant="outline"
            className="border-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Total Categories</p>
              <Tag className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-gray-400 mt-1">
              {parentCategories.length} parent, {subCategories.length} sub
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Personal</p>
              <Home className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalCategories.length}</div>
            <p className="text-xs text-gray-400 mt-1">personal categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Business</p>
              <Building className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessCategories.length}</div>
            <p className="text-xs text-gray-400 mt-1">business categories</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Tax Deductible</p>
              <Settings className="w-4 h-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxDeductibleCategories.length}</div>
            <p className="text-xs text-gray-400 mt-1">tax categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search categories and projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="personal">Personal Only</SelectItem>
            <SelectItem value="business">Business Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Categories</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="tax">Tax Deductible</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CategoryGrid
            categories={filteredCategories}
            onEdit={(category) => {
              setSelectedCategory(category);
              setIsCategoryModalOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <CategoryGrid
            categories={filteredCategories.filter(cat => cat.categoryType === "personal")}
            onEdit={(category) => {
              setSelectedCategory(category);
              setIsCategoryModalOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <div className="space-y-6">
            {/* Projects Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-gray-400 mb-6">
                      Create projects to organize business expenses by client
                    </p>
                    <Button
                      onClick={() => setIsProjectModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onEdit={(project) => {
                          setSelectedProject(project);
                          setIsProjectModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Categories */}
            <CategoryGrid
              categories={filteredCategories.filter(cat => cat.categoryType === "business")}
              onEdit={(category) => {
                setSelectedCategory(category);
                setIsCategoryModalOpen(true);
              }}
              onDelete={handleDeleteCategory}
            />
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <CategoryGrid
            categories={filteredCategories.filter(cat => cat.isTaxDeductible)}
            onEdit={(category) => {
              setSelectedCategory(category);
              setIsCategoryModalOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AdvancedCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        onSave={selectedCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={selectedCategory || undefined}
        categories={categories}
        projects={projects}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProject(null);
        }}
        onSave={selectedProject ? handleUpdateProject : handleCreateProject}
        initialData={selectedProject ? {
          name: selectedProject.name,
          description: selectedProject.description || "",
          clientName: selectedProject.clientName || "",
          projectCode: selectedProject.projectCode || "",
          status: selectedProject.status,
          startDate: selectedProject.startDate || "",
          endDate: selectedProject.endDate || "",
          budget: selectedProject.budget?.toString() || "",
          hourlyRate: selectedProject.hourlyRate?.toString() || "",
          color: selectedProject.color,
          tags: selectedProject.tags,
          isBillable: selectedProject.isBillable,
        } : undefined}
      />
    </div>
  );
}

// Category Grid Component
function CategoryGrid({
  categories,
  onEdit,
  onDelete,
}: {
  categories: UICategory[];
  onEdit: (category: UICategory) => void;
  onDelete: (categoryId: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="text-center py-12">
          <Tag className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No categories found</h3>
          <p className="text-gray-400">
            Create categories to organize your transactions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// Category Card Component
function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: UICategory;
  onEdit: (category: UICategory) => void;
  onDelete: (categoryId: string) => void;
}) {
  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.icon}
            </div>
            <div>
              <h4 className="font-medium">{category.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={category.categoryType === "business" ? "bg-purple-900/20 text-purple-300" : "bg-blue-900/20 text-blue-300"}
                >
                  {category.categoryType === "business" ? <Building className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                  {category.categoryType}
                </Badge>
                {category.isTaxDeductible && (
                  <Badge variant="secondary" className="bg-yellow-900/20 text-yellow-300">
                    Tax
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-8 w-8 p-0"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id!)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
            >
              🗑️
            </Button>
          </div>
        </div>

        {category.description && (
          <p className="text-sm text-gray-400 mb-3">{category.description}</p>
        )}

        {category.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {category.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-gray-700">
                {tag}
              </Badge>
            ))}
            {category.tags.length > 3 && (
              <Badge variant="outline" className="text-xs border-gray-700">
                +{category.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Project Card Component
function ProjectCard({
  project,
  onEdit,
}: {
  project: UIProject;
  onEdit: (project: UIProject) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-emerald-500";
      case "completed": return "text-blue-500";
      case "on_hold": return "text-yellow-500";
      case "cancelled": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{project.name}</h4>
            {project.clientName && (
              <p className="text-sm text-gray-400">{project.clientName}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
              className="h-8 w-8 p-0"
            >
              ✏️
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={getStatusColor(project.status)}
          >
            {project.status.replace("_", " ")}
          </Badge>
          {project.projectCode && (
            <span className="text-xs text-gray-500">{project.projectCode}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}