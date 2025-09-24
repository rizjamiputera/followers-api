-- Create profiles for users who have articles but don't have profiles yet
-- This ensures all article creators have a profile

DO $$
DECLARE
  user_record RECORD;
  content_id UUID;
BEGIN
  FOR user_record IN
    SELECT DISTINCT u.id, u.name
    FROM "followers"."user" u
    WHERE EXISTS (
      SELECT 1 FROM "followers"."article" a WHERE a."authorId" = u.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM "followers"."profile" p WHERE p."userId" = u.id
    )
  LOOP
    -- Create content for biography
    INSERT INTO "followers"."content" (id, content, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), '{"type":"doc","content":[]}'::jsonb, NOW(), NOW())
    RETURNING id INTO content_id;

    -- Create profile
    INSERT INTO "followers"."profile" (
      id, "userId", slug, "isPublic", "contentId", specializations,
      "totalArticles", "totalFollowers", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      user_record.id,
      LOWER(REGEXP_REPLACE(user_record.name, '[^a-zA-Z0-9]', '-', 'g')),
      false,
      content_id,
      ARRAY[]::text[],
      (SELECT COUNT(*) FROM "followers"."article" a WHERE a."authorId" = user_record.id AND a.deleted = false),
      0,
      NOW(),
      NOW()
    );
  END LOOP;
END $$;
