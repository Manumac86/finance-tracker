-- Fix execute_sql function to properly handle parameterized queries
-- This migration updates the execute_sql function to correctly process parameters

DROP FUNCTION IF EXISTS execute_sql(TEXT, JSON);

CREATE OR REPLACE FUNCTION execute_sql(query TEXT, params JSON DEFAULT '[]'::JSON)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    query_result RECORD;
    results JSON[] := '{}';
    param_text TEXT;
    param_array TEXT[];
    i INT;
    formatted_query TEXT;
    params_jsonb JSONB;
BEGIN
    -- Initialize formatted_query
    formatted_query := query;
    
    -- Convert JSON to JSONB for easier manipulation
    params_jsonb := params::JSONB;
    
    -- Process parameters if they exist
    IF jsonb_array_length(params_jsonb) > 0 THEN
        -- Extract each parameter from the JSON array
        FOR i IN 0..jsonb_array_length(params_jsonb) - 1 LOOP
            param_text := params_jsonb->i;
            
            -- Remove surrounding quotes if present
            IF left(param_text, 1) = '"' AND right(param_text, 1) = '"' THEN
                param_text := substr(param_text, 2, length(param_text) - 2);
            END IF;
            
            -- Replace parameter placeholder
            IF param_text = 'null' OR param_text IS NULL THEN
                formatted_query := replace(formatted_query, '$' || (i + 1), 'NULL');
            ELSE
                formatted_query := replace(formatted_query, '$' || (i + 1), quote_literal(param_text));
            END IF;
        END LOOP;
    END IF;
    
    -- Execute the query
    BEGIN
        -- For SELECT queries, collect results
        IF lower(ltrim(query)) LIKE 'select%' THEN
            FOR query_result IN EXECUTE formatted_query LOOP
                results := array_append(results, row_to_json(query_result));
            END LOOP;
            
            -- Convert array to JSON
            result_json := array_to_json(results);
        ELSE
            -- For non-SELECT queries, just execute
            EXECUTE formatted_query;
            result_json := '[]'::JSON;
        END IF;
        
        RETURN COALESCE(result_json, '[]'::JSON);
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error: %, Original Query: %, Formatted Query: %', SQLERRM, query, formatted_query;
            RAISE;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(TEXT, JSON) TO service_role;