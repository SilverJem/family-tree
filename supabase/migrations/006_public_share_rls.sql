-- Adds public read access for shared trees
CREATE POLICY "public_share_links_read" ON share_links FOR SELECT USING (true);
CREATE POLICY "public_shared_trees_read" ON trees FOR SELECT USING (visibility = 'shared_link');
CREATE POLICY "public_shared_people_read" ON people FOR SELECT USING (tree_id IN (SELECT id FROM trees WHERE visibility = 'shared_link'));
CREATE POLICY "public_shared_rel_read" ON relationships FOR SELECT USING (tree_id IN (SELECT id FROM trees WHERE visibility = 'shared_link'));
