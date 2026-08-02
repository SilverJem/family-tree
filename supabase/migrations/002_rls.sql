-- =====================================================================
-- Family Tree Builder — Row Level Security Policies (Phase 2)
-- Run this AFTER 001_schema.sql in the Supabase SQL Editor
-- =====================================================================

-- ---- TREES ----
ALTER TABLE trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trees_owner_select" ON trees
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "trees_owner_insert" ON trees
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "trees_owner_update" ON trees
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "trees_owner_delete" ON trees
    FOR DELETE USING (owner_id = auth.uid());


-- ---- PEOPLE ----
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people_owner_select" ON people
    FOR SELECT USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "people_owner_insert" ON people
    FOR INSERT WITH CHECK (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "people_owner_update" ON people
    FOR UPDATE USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "people_owner_delete" ON people
    FOR DELETE USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );


-- ---- RELATIONSHIPS ----
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_owner_select" ON relationships
    FOR SELECT USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "rel_owner_insert" ON relationships
    FOR INSERT WITH CHECK (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "rel_owner_update" ON relationships
    FOR UPDATE USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

CREATE POLICY "rel_owner_delete" ON relationships
    FOR DELETE USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );


-- ---- TREE MEMBERS ----
ALTER TABLE tree_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_owner_manage" ON tree_members
    FOR ALL USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );


-- ---- SHARE LINKS ----
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_links_owner" ON share_links
    FOR ALL USING (
        tree_id IN (SELECT id FROM trees WHERE owner_id = auth.uid())
    );

-- Note: Share view reads (public, no auth) are handled via a Supabase Edge Function
-- that uses the service role key to bypass RLS after validating the token hash.
-- This is built in Phase 7.
