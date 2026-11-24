-- CHAT_DELETE (370): delete chat rooms and messages from the admin panel.
-- Granted to superadmin here; other roles get it from the Roles page.
UPDATE roles
SET permissions = array_append(permissions, 370),
    modules     = array_append(modules, 370)
WHERE slug = 'superadmin' AND NOT (370 = ANY(permissions));
