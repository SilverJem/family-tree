-- Add godparent_godchild to the relationship types constraint
ALTER TABLE relationships DROP CONSTRAINT relationships_type_check;

ALTER TABLE relationships ADD CONSTRAINT relationships_type_check CHECK (
    type IN (
        'parent_child',
        'step_parent_child',
        'adoptive_parent_child',
        'foster_parent_child',
        'spouse',
        'partner',
        'divorced_spouse',
        'ex_partner',
        'sibling',
        'half_sibling',
        'godparent_godchild'
    )
);
