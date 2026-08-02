-- =====================================================================
-- Family Tree Builder — Database Schema (Phase 2)
-- Run this in the Supabase SQL Editor
-- =====================================================================

-- Trees: owned by auth.users, not a separate users table
CREATE TABLE IF NOT EXISTS trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('private', 'shared_link', 'public')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- People: nodes in the tree
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    birth_name TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'unknown')),
    birth_date DATE,
    death_date DATE,
    is_living BOOLEAN DEFAULT true,
    photo_url TEXT,
    canvas_x FLOAT DEFAULT 100,
    canvas_y FLOAT DEFAULT 100,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relationships: the edges of the family graph
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'parent_child',
        'step_parent_child',
        'adoptive_parent_child',
        'foster_parent_child',
        'spouse',
        'partner',
        'divorced_spouse',
        'ex_partner'
    )),
    person_a_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    person_b_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_relationship CHECK (person_a_id != person_b_id)
);

-- Tree members (for future collaboration — roles schema built now)
CREATE TABLE IF NOT EXISTS tree_members (
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    invited_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tree_id, user_id)
);

-- Share links: token stored hashed for security
CREATE TABLE IF NOT EXISTS share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_people_tree_id ON people(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_tree_id ON relationships(tree_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_a ON relationships(person_a_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person_b ON relationships(person_b_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token_hash);
