-- V4__drop_uk_google_profile_user_id.sql

-- Drop the dynamically generated unique constraint from Hibernate on user_id
ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS uk_3pbkep1vf9tbfg6p64i05hiwk;

-- Just in case it was generated with a different name on the user's DB, we can also use an anonymous block to drop it dynamically:
DO $$ 
DECLARE 
    const_name text;
BEGIN
    SELECT constraint_name INTO const_name
    FROM information_schema.table_constraints
    WHERE table_name = 'user_identity_profile' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name != 'user_identity_profile_google_email_key'
    AND constraint_name != 'user_identity_profile_google_sub_key'
    AND constraint_name != 'uk_4y24h6k6s1a6d96p6c2688h64' -- another random name if any
    AND constraint_name NOT LIKE '%email%' 
    AND constraint_name NOT LIKE '%sub%';

    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE user_identity_profile DROP CONSTRAINT IF EXISTS ' || const_name;
    END IF;
END $$;
