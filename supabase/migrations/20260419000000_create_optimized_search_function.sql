-- =============================================================================
-- Migration: Create optimized search function
-- Date: 2026-04-19
-- Purpose: Create the optimized search function required by Supabase storage
-- =============================================================================

CREATE OR REPLACE FUNCTION public.optimized_search_function(
    query text,
    table_name text,
    search_columns text[],
    limit_count integer DEFAULT 10,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    score numeric,
    record jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    search_query text;
    i integer;
    column_list text := '';
BEGIN
    -- Build the column list for the search
    FOR i IN 1..array_length(search_columns, 1) LOOP
        IF i > 1 THEN
            column_list := column_list || ' || '' '' || ';
        END IF;
        column_list := column_list || 'COALESCE(' || search_columns[i] || '::text, '''')';
    END LOOP;
    
    -- Execute the search query
    RETURN QUERY EXECUTE format(
        'SELECT id, ' ||
        'ts_rank_cd(to_tsvector(''simple'', ' || column_list || '), ' ||
        'plainto_tsquery(''simple'', $1)) as score, ' ||
        'to_jsonb(t) as record ' ||
        'FROM ' || quote_ident(table_name) || ' t ' ||
        'WHERE to_tsvector(''simple'', ' || column_list || ') @@ ' ||
        'plainto_tsquery(''simple'', $1) ' ||
        'ORDER BY score DESC ' ||
        'LIMIT $2 OFFSET $3',
        query, limit_count, offset_count
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.optimized_search_function(text, text, text[], integer, integer) TO authenticated, anon, service_role;

-- Comment on the function
COMMENT ON FUNCTION public.optimized_search_function(text, text, text[], integer, integer) IS
'Optimized search function for full-text search across multiple columns in a table. '
'Parameters: query (search text), table_name (table to search), search_columns (columns to search in), '
'limit_count (max results), offset_count (pagination offset)';