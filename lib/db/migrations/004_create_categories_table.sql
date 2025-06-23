-- Create categories table for transaction categorization
-- This migration creates the categories table and populates it with default categories

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES 
  ('Food & Drink', 'Restaurants, groceries, coffee shops', 'Coffee', '#10B981'),
  ('Shopping', 'Clothing, electronics, general purchases', 'ShoppingBag', '#F59E0B'),
  ('Transportation', 'Gas, public transport, ride shares', 'Car', '#EF4444'),
  ('Entertainment', 'Movies, streaming, games, hobbies', 'Gamepad2', '#8B5CF6'),
  ('Bills & Utilities', 'Rent, electricity, internet, phone', 'Receipt', '#06B6D4'),
  ('Healthcare', 'Medical, dental, pharmacy', 'Heart', '#EC4899'),
  ('Education', 'Tuition, books, courses', 'GraduationCap', '#3B82F6'),
  ('Travel', 'Flights, hotels, vacation expenses', 'Plane', '#14B8A6'),
  ('Income', 'Salary, freelance, investments', 'ArrowDownLeft', '#10B981'),
  ('Savings', 'Emergency fund, investments', 'PiggyBank', '#059669'),
  ('Gifts & Donations', 'Presents, charity, tips', 'Gift', '#D97706'),
  ('Personal Care', 'Haircuts, cosmetics, gym', 'Scissors', '#84CC16'),
  ('Home & Garden', 'Furniture, tools, plants', 'Home', '#6366F1'),
  ('Insurance', 'Health, auto, life insurance', 'Shield', '#0EA5E9'),
  ('Taxes', 'Income tax, property tax', 'Calculator', '#64748B'),
  ('Other', 'Miscellaneous expenses', 'MoreHorizontal', '#6B7280')
ON CONFLICT (name) DO NOTHING;