-- Enhanced execute_sql function that properly handles JSON parameters
-- This version detects JSON strings and handles them without double-quoting

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
    i INT;
    formatted_query TEXT;
    params_jsonb JSONB;
    is_json_value BOOLEAN;
BEGIN
    -- Initialize formatted_query
    formatted_query := query;
    
    -- Convert JSON to JSONB for easier manipulation
    params_jsonb := params::JSONB;
    
    -- Process parameters if they exist
    IF jsonb_array_length(params_jsonb) > 0 THEN
        -- Extract each parameter from the JSON array
        FOR i IN 0..jsonb_array_length(params_jsonb) - 1 LOOP
            param_text := params_jsonb->>i;
            
            -- Check if this looks like a JSON object or array
            is_json_value := param_text IS NOT NULL AND 
                           (left(param_text, 1) = '{' AND right(param_text, 1) = '}') OR
                           (left(param_text, 1) = '[' AND right(param_text, 1) = ']');
            
            -- Replace parameter placeholder
            IF param_text IS NULL THEN
                formatted_query := replace(formatted_query, '$' || (i + 1), 'NULL');
            ELSIF is_json_value THEN
                -- For JSON values, escape single quotes and wrap in single quotes
                formatted_query := replace(formatted_query, '$' || (i + 1), 
                    '''' || replace(param_text, '''', '''''') || '''');
            ELSE
                -- For regular values, use quote_literal
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