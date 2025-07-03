-- Quick fix for transaction category relationship issue
-- This creates a view that can be used temporarily until the full migration is applied

-- Create a view that presents transactions with proper category joins
-- This view maps string category_ids to the actual category UUIDs
CREATE OR REPLACE VIEW transactions_with_categories AS
WITH category_mapping AS (
  SELECT 
    id,
    name,
    icon,
    ROW_NUMBER() OVER (ORDER BY created_at) as legacy_id
  FROM categories
  WHERE is_system_category = true OR is_system_category IS NULL
)
SELECT 
  t.*,
  c.id as category_uuid,
  c.name as resolved_category_name,
  c.icon as resolved_category_icon
FROM transactions t
LEFT JOIN category_mapping c ON t.category_id = c.legacy_id::text;

-- Grant permissions on the view
GRANT SELECT ON transactions_with_categories TO authenticated;

-- Comment on the view
COMMENT ON VIEW transactions_with_categories IS 'Temporary view to handle legacy string category_ids until migration is complete';