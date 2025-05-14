"use client";

import { useState } from "react";
import { addCategoryAction } from "@/actions/categories";
import { useCategories } from "@/contexts/categories";
import { Category } from "@/lib/db/schemas";

export function CategoriesList() {
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const { categories, setCategories } = useCategories();
  const [category, setCategory] = useState<Category>({
    name: "",
    description: "",
    icon: "",
  });

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, success } = await addCategoryAction(category);
    if (success && data) {
      setCategories([...categories, data]);
      setShowAddCategoryModal(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCategory({ ...category, [e.target.name]: e.target.value });
  };

  if (!categories) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showAddCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  value={category.name}
                  onChange={handleChange}
                />
                <label htmlFor="description" className="block mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  value={category.description}
                  onChange={handleChange}
                />
                <label htmlFor="icon" className="block mb-2">
                  Icon
                </label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  value={category.icon}
                  onChange={handleChange}
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex items-center justify-center">
          <div className="text-center text-gray-400">No categories found</div>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{category.name}</span>
              </div>
            </div>
          </div>
        ))
      )}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={() => {
          setShowAddCategoryModal(true);
        }}
      >
        Add Category
      </button>
    </div>
  );
}
