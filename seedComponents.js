// Run this script with Node.js to seed your Supabase database
// Usage: node seedComponents.js

import { createClient } from '@supabase/supabase-js';

// Connect to your local Supabase instance
const supabaseUrl = 'https://cdsiwgwtdvrbkdphoyjp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc2l3Z3d0ZHZyYmtkcGhveWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNjIyMjcsImV4cCI6MjA1NDgzODIyN30.YN7s3X8v5IWBYuYim0XPdhHVcPwrQJ2aung9_8meBdE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample components data
const components = [
  // Layouts
  { id: 'eeb94407-7694-4437-a79e-c67e1e1fd8ad', title: 'Hero Header 1', type: 'layouts', category: 'Hero Headers', is_pro: false, description: 'Simple and clean hero section' },
  { id: 'bc8da6f2-4a67-482f-909c-28f3c5269d8e', title: 'Bento Grid 9', type: 'layouts', category: 'Bento Grids', is_pro: true, description: 'Advanced bento grid layout' },
  { id: '5a1edb9e-cb4f-4a90-80b4-db87ef1f5634', title: 'Features 36', type: 'layouts', category: 'Features', is_pro: true, description: 'Feature section with icons' },
  { id: 'd2c7d229-1452-4fcf-beee-ad50e3a7c9b6', title: 'Integrations 12', type: 'layouts', category: 'Integrations', is_pro: true, description: 'Integration showcase section' },
  { id: '8c7b8c7a-8b4a-4b4a-8b4a-8b4a8b4a8b4a', title: 'Navbar 7', type: 'layouts', category: 'Navbars', is_pro: true, description: 'Modern responsive navbar' },
  { id: '9d8c9d8b-9c5b-5c5b-9c5b-9c5b9c5b9c5b', title: 'Contact 21', type: 'layouts', category: 'Contact', is_pro: true, description: 'Contact form with map' },
  
  // Web UI
  { id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', title: 'Accordion 1', type: 'webui', category: 'Accordions', is_pro: false, description: 'Simple accordion component' },
  { id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', title: 'Banner 7', type: 'webui', category: 'Banners', is_pro: true, description: 'Notification banner with actions' },
  { id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8', title: 'Avatar 3', type: 'webui', category: 'Avatars', is_pro: true, description: 'User avatar with status indicator' },
  { id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', title: 'Badge 16', type: 'webui', category: 'Badges', is_pro: true, description: 'Status and notification badges' },
  
  // Tokens
  { id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', title: 'Typography 1', type: 'tokens', category: 'Text styles', is_pro: false, description: 'Complete typography system' },
  { id: 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', title: 'Colors 1', type: 'tokens', category: 'Color styles', is_pro: false, description: 'Brand color palette' },
  
  // Templates
  { id: 'g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2', title: 'SaaS - Cloud', type: 'templates', category: 'SaaS', is_pro: false, description: 'SaaS landing page template' },
  { id: 'h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', title: 'Agency 1', type: 'templates', category: 'Agency', is_pro: false, description: 'Digital agency website template' }
];

// Component URLs data
const componentUrls = [
  { component_id: 'eeb94407-7694-4437-a79e-c67e1e1fd8ad', url: 'Hero-header-1-Lyue.js@o8jazO3DJk1kN3WrrSdv', is_latest: true },
  { component_id: 'bc8da6f2-4a67-482f-909c-28f3c5269d8e', url: 'Bento-9-uQfG.js@dYR5DqHVgDZ0SItxNcu5', is_latest: true },
  { component_id: '5a1edb9e-cb4f-4a90-80b4-db87ef1f5634', url: 'Feature-36-Uf59.js@QBLSU627SKVg690IMf9z', is_latest: true },
  { component_id: 'd2c7d229-1452-4fcf-beee-ad50e3a7c9b6', url: 'Integration-12-jEzQ.js@4uY7xewBb1rMUH66JPqp', is_latest: true },
  { component_id: '8c7b8c7a-8b4a-4b4a-8b4a-8b4a8b4a8b4a', url: 'navbar-7', is_latest: true },
  { component_id: '9d8c9d8b-9c5b-5c5b-9c5b-9c5b9c5b9c5b', url: 'contact-21', is_latest: true },
  { component_id: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6', url: 'accordion-1', is_latest: true },
  { component_id: 'b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q7', url: 'banner-7', is_latest: true },
  { component_id: 'c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8', url: 'avatar-3', is_latest: true },
  { component_id: 'd4e5f6g7-h8i9-j0k1-l2m3-n4o5p6q7r8s9', url: 'badge-16', is_latest: true },
  { component_id: 'e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0', url: 'typography-1', is_latest: true },
  { component_id: 'f6g7h8i9-j0k1-l2m3-n4o5-p6q7r8s9t0u1', url: 'colors-1', is_latest: true },
  { component_id: 'g7h8i9j0-k1l2-m3n4-o5p6-q7r8s9t0u1v2', url: 'saas-cloud', is_latest: true },
  { component_id: 'h8i9j0k1-l2m3-n4o5-p6q7-r8s9t0u1v2w3', url: 'agency-1', is_latest: true }
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (optional)
    console.log('Clearing existing data...');
    await supabase.from('component_urls').delete().not('id', 'is', null);
    await supabase.from('components').delete().not('id', 'is', null);
    
    // Insert components
    console.log('Inserting components...');
    const { error: componentsError } = await supabase
      .from('components')
      .insert(components);
    
    if (componentsError) {
      throw componentsError;
    }
    
    // Insert component URLs
    console.log('Inserting component URLs...');
    const { error: urlsError } = await supabase
      .from('component_urls')
      .insert(componentUrls);
    
    if (urlsError) {
      throw urlsError;
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase();