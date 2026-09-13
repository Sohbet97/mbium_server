-- 069: Normalize root comments stored with parent_id = 0 to NULL

UPDATE comments SET parent_id = NULL WHERE parent_id = 0;
