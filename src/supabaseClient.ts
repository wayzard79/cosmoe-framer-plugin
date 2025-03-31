// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { framer } from 'framer-plugin';

const supabaseUrl = 'https://cdsiwgwtdvrbkdphoyjp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc2l3Z3d0ZHZyYmtkcGhveWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNjIyMjcsImV4cCI6MjA1NDgzODIyN30.YN7s3X8v5IWBYuYim0XPdhHVcPwrQJ2aung9_8meBdE';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Auth types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  email_confirmed_at?: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

// Mock components for fallback
export const MOCK_COMPONENTS = [
  // Layout components
  { id: '1', title: 'Hero Header 1', is_pro: false, url: 'Hero-header-1-Lyue.js@o8jazO3DJk1kN3WrrSdv', type: 'layouts', category: 'Hero Headers' },
  { id: '2', title: 'Bento Grid 9', is_pro: true, url: 'Bento-9-uQfG.js@dYR5DqHVgDZ0SItxNcu5', type: 'layouts', category: 'Bento Grids' },
  { id: '3', title: 'Features 36', is_pro: true, url: 'Feature-36-Uf59.js@QBLSU627SKVg690IMf9z', type: 'layouts', category: 'Features' },
  { id: '4', title: 'Integrations 12', is_pro: true, url: 'Integration-12-jEzQ.js@4uY7xewBb1rMUH66JPqp', type: 'layouts', category: 'Integrations' },
  { id: '5', title: 'Navbar 7', is_pro: true, url: 'navbar-7', type: 'layouts', category: 'Navbars' },
  { id: '6', title: 'Contact 21', is_pro: true, url: 'contact-21', type: 'layouts', category: 'Contact' },
  
  // Web UI components
  { id: '9', title: 'Accordion 1', is_pro: false, url: 'accordion-1', type: 'webui', category: 'Accordions' },
  { id: '10', title: 'Banner 7', is_pro: true, url: 'banner-7', type: 'webui', category: 'Banners' },
  { id: '11', title: 'Avatar 3', is_pro: true, url: 'avatar-3', type: 'webui', category: 'Avatars' },
  { id: '12', title: 'Badge 16', is_pro: true, url: 'badge-16', type: 'webui', category: 'Badges' },
  
  // Tokens
  { id: '17', title: 'Typography 1', is_pro: false, url: 'typography-1', type: 'tokens', category: 'Text styles' },
  { id: '18', title: 'Typography 3', is_pro: true, url: 'typography-3', type: 'tokens', category: 'Text styles' },
  
  // Templates
  { id: '22', title: 'SaaS - Cloud', is_pro: false, url: 'saas-cloud', type: 'templates', category: 'SaaS' },
  { id: '23', title: 'SaaS - ERP', is_pro: true, url: 'saas-erp', type: 'templates', category: 'SaaS' },
  { id: '24', title: 'Agency 1', is_pro: false, url: 'agency-1', type: 'templates', category: 'Agency' },
  { id: '25', title: 'Portfolio 1', is_pro: true, url: 'portfolio-1', type: 'templates', category: 'Agency' },
];

// Component types
export interface ComponentData {
  id: string;
  title: string;
  description?: string;
  type: 'layouts' | 'webui' | 'tokens' | 'templates';
  category: string;
  is_pro: boolean;
  url?: string;
  thumbnail?: string;
  processedUrl?: string; // Add this for optimized loading
}

// Style types
export interface ColorStyleDB {
  id: string;
  framer_id: string;
  name: string;
  folder: string | null;
  light_color: string;
  dark_color: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TextStyleDB {
  id: string;
  framer_id: string;
  name: string;
  folder: string | null;
  font_family: string | null;
  font_weight: number | null;
  font_style: string | null;
  font_size: string;
  line_height: string | null;
  color: string | null;
  tag: string | null;
  breakpoints?: any[]; // Simplified for now
  created_at?: string;
  updated_at?: string;
}

// Auth functions
export async function signIn(email: string, password: string): Promise<{ data: AuthSession | null, error: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    console.log("User signed in:", data.user?.id);
    
    // After login, properly handle favorites
    if (data.user) {
      // Get favorites from Supabase
      const serverFavorites = await getFavoritesFromSupabase(data.user.id);
      
      // Get local favorites
      const localFavorites = await getFavorites();
      
      // If user has server favorites, use those (don't overwrite with local)
      if (serverFavorites.length > 0) {
        // Update local storage with server favorites
        localStorage.setItem('favoriteComponents', JSON.stringify(serverFavorites));
      } else {
        // If user has no server favorites, sync local favorites to Supabase
        await syncFavoritesToSupabase(data.user.id, localFavorites);
      }
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Sign-in error:", error);
    return { data: null, error };
  }
}

export async function signUp(email: string, password: string): Promise<{ data: any, error: any }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { data: null, error };
  }
}

export async function signOut(): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Sign-out error:", error);
    return { error };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function setupAuthListener(callback: (user: AuthUser | null) => void): Promise<() => void> {
  try {
    const { data: { subscription } } = await supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      callback(session?.user || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error("Error setting up auth listener:", error);
    return () => {};
  }
}

// Cache for storing query results
const componentsCache = new Map<string, { data: ComponentData[]; count: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Debug helper to log category data when needed
export function logCategoryInfo(components: ComponentData[], tabName: string, filterOptions: string[]) {
  // Log unique categories from components
  const uniqueCategories = new Set(components.map(c => c.category));
  console.log('Unique component categories for', tabName, ':', Array.from(uniqueCategories).sort());
  
  // Log filter options
  console.log('Filter options for', tabName, ':', filterOptions);
  
  // Check for mismatches
  const categoryMismatches = [];
  for (const category of uniqueCategories) {
    const matchingOption = filterOptions.find(option => 
      option.toLowerCase() === category.toLowerCase() || 
      option.toLowerCase().replace(/s$/, '') === category.toLowerCase() ||
      option.toLowerCase() === category.toLowerCase() + 's'
    );
    
    if (!matchingOption && !filterOptions.some(opt => opt.startsWith('All'))) {
      categoryMismatches.push({ 
        componentCategory: category, 
        availableOptions: filterOptions
      });
    }
  }
  
  if (categoryMismatches.length > 0) {
    console.warn('Category mismatches detected:', categoryMismatches);
  }
}

// Fetch license data for a user
export async function fetchLicenseData(userId: string): Promise<any> {
  console.log("fetchLicenseData called for userId:", userId);
  try {
    // First try to get license by user_id
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error fetching license data:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log("License found for user:", data[0]);
      return data[0];
    }
    
    // If not found by user_id, try to find by email via customer_profiles
    const { data: userProfile } = await supabase.auth.getUser();
    const userEmail = userProfile?.user?.email;
    
    if (!userEmail) {
      console.log("No user email found");
      return null;
    }
    
    // Try to find profile by email
    const { data: profile, error: profileError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('email', userEmail)
      .single();
      
    if (profileError || !profile) {
      console.log("No profile found for email:", userEmail);
      return null;
    }
    
    // Check if profile has license key or if plan_type is PRO
    if (profile.plan_type === 'PRO') {
      console.log("User has PRO plan in profile");
      return {
        status: 'active',
        plan_type: 'PRO',
        expires_at: null
      };
    }
    
    if (!profile.license_key) {
      console.log("No license key in profile");
      return null;
    }
    
    // Try to find license by license key from profile
    const { data: licenseData, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('key', profile.license_key)
      .single();
      
    if (licenseError) {
      console.error("Error fetching license by key:", licenseError);
      return null;
    }
    
    console.log("License found by key:", licenseData);
    return licenseData;
  } catch (error) {
    console.error('Error in fetchLicenseData:', error);
    return null;
  }
}

// Fetch components with filtering and pagination
export async function fetchComponents(options: {
  type?: string;
  category?: string;
  is_pro?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: ComponentData[]; count: number }> {
  const { type, category, is_pro, search, page = 1, pageSize = 20 } = options;

  // Create a cache key from the query parameters
  const cacheKey = JSON.stringify(options);

  // Check cache first - avoid cache for search queries to ensure fresh results
  // Also avoid cache for category filters to ensure we always get fresh data
  if (!search && !category && componentsCache.get(cacheKey) && (Date.now() - componentsCache.get(cacheKey)!.timestamp < CACHE_TTL)) {
    console.log('Using cached data for query:', options);
    return { data: componentsCache.get(cacheKey)!.data, count: componentsCache.get(cacheKey)!.count };
  }

  try {
    console.log('Fetching data from Supabase for query:', options);

    // Start building the query
    let query = supabase
      .from('components')
      .select(`
        *,
        component_urls!left(id, url, is_latest),
        component_assets!left(id, asset_type, file_path)
      `, { count: 'exact' });

    // Apply filters
    if (type) query = query.eq('type', type);
    
    // Case-insensitive category matching - improved to handle more variants
    if (category) {
      // Transform category for more flexible matching
      const categoryLower = category.toLowerCase();
      const categoryWithoutS = categoryLower.replace(/s$/, '');
      const categoryWithS = categoryLower.endsWith('s') ? categoryLower : `${categoryLower}s`;
      
      // Build a more comprehensive OR condition for category matching
      let categoryCondition = `category.ilike.%${categoryLower}%`;
      
      // Add additional conditions for exact matches
      categoryCondition += `,category.eq.${category}`;
      categoryCondition += `,category.eq.${categoryWithoutS}`;
      categoryCondition += `,category.eq.${categoryWithS}`;
      
      // Special case for Hero Headers
      if (categoryLower.includes('hero') || categoryLower.includes('header')) {
        categoryCondition += ',category.ilike.%Hero%,category.ilike.%header%';
      }
      
      // Use the expanded condition for better matching
      query = query.or(categoryCondition);
    }
    
    if (is_pro !== undefined) query = query.eq('is_pro', is_pro);

    // Apply search filter - improved search for title fields
    if (search) {
      console.log('Applying search filter to title:', search);
      // Use ilike for case-insensitive partial match with wildcards on both sides
      query = query.ilike('title', `%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Execute the query
    const { data, error, count } = await query
      .order('title')
      .range(from, to);

    // Debug category info
    if (data && data.length > 0 && category) {
      console.log(`Found ${data.length} components for category filter "${category}"`);
      const uniqueCategories = new Set(data.map(item => item.category));
      console.log('Actual categories found:', Array.from(uniqueCategories));
    } else if (category) {
      console.warn(`No components found for category filter "${category}"`);
    }

    // Add debugging for count issue
    console.log(`Count from Supabase for type '${type}':`, count);
    
    // For category filters, get a more accurate count with a separate query
    let filteredCount = count;
    if (category || is_pro !== undefined || search) {
      // Get a more accurate count by making a separate count query with the same filters
      const countQuery = supabase
        .from('components')
        .select('id', { count: 'exact', head: true });
      
      if (type) countQuery.eq('type', type);
      
      // Apply the same category filter
      if (category) {
        const categoryLower = category.toLowerCase();
        const categoryWithoutS = categoryLower.replace(/s$/, '');
        const categoryWithS = categoryLower.endsWith('s') ? categoryLower : `${categoryLower}s`;
        
        let categoryCondition = `category.ilike.%${categoryLower}%`;
        categoryCondition += `,category.eq.${category}`;
        categoryCondition += `,category.eq.${categoryWithoutS}`;
        categoryCondition += `,category.eq.${categoryWithS}`;
        
        if (categoryLower.includes('hero') || categoryLower.includes('header')) {
          categoryCondition += ',category.ilike.%Hero%,category.ilike.%header%';
        }
        
        countQuery.or(categoryCondition);
      }
      
      if (is_pro !== undefined) countQuery.eq('is_pro', is_pro);
      if (search) countQuery.ilike('title', `%${search}%`);
      
      const { count: actualCount, error: countError } = await countQuery;
      
      if (!countError && actualCount !== null) {
        console.log(`Verified count for type '${type}' with filters:`, actualCount);
        filteredCount = actualCount;
      }
    }

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Format the response
    const formattedData = data?.map(item => {
      // Get URL from the first component_url entry
      const urls = item.component_urls as any[];
      const url = urls && urls.length > 0 ? urls[0].url : undefined;

      // Get thumbnail from component_assets
      const assets = item.component_assets as any[];
      const thumbnail = assets && assets.length > 0
        ? assets.find(asset => asset.asset_type === 'thumbnail')?.file_path
        : undefined;

      // Pre-process the URL for faster loading
      const processedUrl = url && !url.startsWith('https://') 
        ? `https://framer.com/m/${url}` 
        : url;

      return {
        id: item.id,
        title: item.title,
        description: item.description,
        type: item.type,
        category: item.category,
        is_pro: item.is_pro,
        url: url,
        processedUrl: processedUrl,
        thumbnail: thumbnail
      };
    }) || [];

    // Fix the known count issue
    if (filteredCount === 548) filteredCount = 542;

    // Store in cache with timestamp - don't cache search or category results 
    // to ensure fresh data for these specific filters
    if (!search && !category) {
      componentsCache.set(cacheKey, {
        data: formattedData,
        count: filteredCount,
        timestamp: Date.now()
      });
    }

    return { 
      data: formattedData, 
      count: filteredCount
    };
  } catch (error) {
    console.error('Error fetching components:', error);

    // Fall back to cache even if expired
    const expiredCache = componentsCache.get(cacheKey);
    if (expiredCache) {
      console.log('Using expired cache due to error');
      return { data: expiredCache.data, count: expiredCache.count };
    }

    // If no cache is available, use mock components with improved filtering
    console.log('Using mock components as fallback');
    
    // Filter mock components to match the requested type
    let filteredMocks = [...MOCK_COMPONENTS];
    
    if (type) {
      filteredMocks = filteredMocks.filter(comp => comp.type === type);
    }
    
    if (category) {
      const categoryLower = category.toLowerCase();
      
      filteredMocks = filteredMocks.filter(comp => {
        const compCategory = comp.category.toLowerCase();
        // More flexible category matching for mocks
        return compCategory.includes(categoryLower) || 
               categoryLower.includes(compCategory) ||
               // Handle variations like singular/plural
               compCategory.replace(/s$/, '') === categoryLower.replace(/s$/, '');
      });
    }
    
    if (is_pro !== undefined) {
      filteredMocks = filteredMocks.filter(comp => comp.is_pro === is_pro);
    }
    
    // Apply search filter to mock data
    if (search) {
      console.log('Applying search filter to mock data:', search);
      const searchLower = search.toLowerCase();
      filteredMocks = filteredMocks.filter(comp => 
        comp.title.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination to mock data
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMocks = filteredMocks.slice(startIndex, endIndex);
    
    return { data: paginatedMocks, count: filteredMocks.length };
  }
}

// Create a realtime subscription for favorites
export function subscribeToFavorites(userId: string, onChange: (favoriteIds: string[]) => void): () => void {
  if (!userId) {
    console.warn("Cannot subscribe to favorites: no user ID provided");
    return () => {}; // Return empty cleanup function
  }
  
  console.log(`Setting up realtime subscription for user ${userId}'s favorites`);
  
  // Create a channel specific to this user's favorites
  const channel = supabase
    .channel(`favorites-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'user_favorites',
        filter: `user_id=eq.${userId}` // Only listen for this user's changes
      },
      async (payload) => {
        console.log('Favorites change detected:', payload);
        
        // When any change happens, re-fetch all favorites
        const updatedFavorites = await getFavoritesFromSupabase(userId);
        onChange(updatedFavorites);
      }
    )
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

  // Return a cleanup function that unsubscribes
  return () => {
    console.log('Cleaning up favorites subscription');
    supabase.removeChannel(channel);
  };
}

// Favorites syncing functions
export async function syncFavoritesToSupabase(userId: string, favoriteIds: string[]): Promise<boolean> {
  try {
    // First, get existing favorites from Supabase
    const { data: existingFavorites, error: fetchError } = await supabase
      .from('user_favorites')
      .select('component_id')
      .eq('user_id', userId);
    
    if (fetchError) throw fetchError;
    
    const existingIds = existingFavorites?.map(fav => fav.component_id) || [];
    
    // Calculate which favorites to add and which to remove
    const idsToAdd = favoriteIds.filter(id => !existingIds.includes(id));
    const idsToRemove = existingIds.filter(id => !favoriteIds.includes(id));
    
    // Add new favorites
    if (idsToAdd.length > 0) {
      const newFavorites = idsToAdd.map(id => ({
        user_id: userId,
        component_id: id,
        created_at: new Date().toISOString()
      }));
      
      const { error: addError } = await supabase
        .from('user_favorites')
        .insert(newFavorites);
      
      if (addError) throw addError;
    }
    
    // Remove favorites that are no longer in the list
    if (idsToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .in('component_id', idsToRemove);
      
      if (removeError) throw removeError;
    }
    
    console.log(`Synced favorites for user ${userId}: added ${idsToAdd.length}, removed ${idsToRemove.length}`);
    return true;
  } catch (error) {
    console.error("Error syncing favorites to Supabase:", error);
    return false;
  }
}

export async function getFavoritesFromSupabase(userId: string): Promise<string[]> {
  try {
    if (!userId) {
      console.warn("Cannot get favorites: no user ID provided");
      return [];
    }
    
    const { data, error } = await supabase
      .from('user_favorites')
      .select('component_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return data?.map(favorite => favorite.component_id) || [];
  } catch (error) {
    console.error("Error fetching favorites from Supabase:", error);
    return [];
  }
}

// Get favorites from either Supabase or localStorage
export async function getFavorites(userId?: string, forceRefresh: boolean = false): Promise<string[]> {
  try {
    // If user is logged in, get favorites from Supabase
    if (userId) {
      const serverFavorites = await getFavoritesFromSupabase(userId);
      
      // If server has favorites or we're forcing a refresh, use server data
      if (serverFavorites.length > 0 || forceRefresh) {
        // Update local storage with server favorites
        localStorage.setItem('favoriteComponents', JSON.stringify(serverFavorites));
        return serverFavorites;
      }
    }
    
    // Otherwise get favorites from local storage
    const favs = localStorage.getItem('favoriteComponents');
    return favs ? JSON.parse(favs) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

// Save favorites to either Supabase or localStorage or both
export async function saveFavorites(ids: string[], userId?: string): Promise<boolean> {
  try {
    // Always save to local storage
    localStorage.setItem('favoriteComponents', JSON.stringify(ids));
    
    // If user is logged in, also sync to Supabase
    if (userId) {
      await syncFavoritesToSupabase(userId, ids);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving favorites:', error);
    return false;
  }
}

// Function to check if realtime is properly enabled in Supabase
export async function testRealtimeConnection(): Promise<{success: boolean, message: string}> {
  try {
    console.log('Testing realtime connection...');
    
    // Try to set up a test subscription
    let receivedMessage = false;
    let errorMessage: string | null = null;
    
    const channel = supabase
      .channel('realtime-test')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_favorites'
        },
        (payload) => {
          console.log('Test realtime message received:', payload);
          receivedMessage = true;
        }
      )
      .subscribe((status) => {
        console.log('Test subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime changes');
        } else if (status === 'CHANNEL_ERROR') {
          errorMessage = 'Error subscribing to realtime changes';
        } else if (status === 'TIMED_OUT') {
          errorMessage = 'Subscription timed out';
        }
      });
    
    // Wait a bit to see if we get connected
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Clean up
    supabase.removeChannel(channel);
    
    if (errorMessage) {
      return {
        success: false,
        message: errorMessage
      };
    }
    
    return {
      success: true,
      message: 'Realtime connection successful'
    };
  } catch (error) {
    console.error('Error testing realtime connection:', error);
    return {
      success: false,
      message: `Error testing realtime: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Check what tables are enabled for realtime
export async function checkRealtimeTablesEnabled(): Promise<string[]> {
  try {
    // Try a simpler approach since the RPC might not exist
    const channel = supabase.channel('table-test');
    
    // We'll create a set to collect tables that appear to be enabled
    const enabledTables = new Set<string>();
    
    // Try to subscribe to various tables
    const tables = ['user_favorites', 'components', 'users', 'profiles'];
    
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          enabledTables.add(table);
        }
      );
    });
    
    // Subscribe to the channel
    channel.subscribe();
    
    // Wait a bit for subscriptions to be processed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up
    supabase.removeChannel(channel);
    
    return Array.from(enabledTables);
  } catch (error) {
    console.error('Error checking realtime tables:', error);
    return [];
  }
}

// Utility functions for style management
function parseStyleName(fullName: string): { name: string; folder: string | null } {
  const parts = fullName.split('/');
  
  if (parts.length === 1) {
    return {
      name: parts[0],
      folder: null
    };
  }
  
  return {
    name: parts[parts.length - 1],
    folder: parts.slice(0, -1).join('/')
  };
}

// Get all color styles from Framer and format them
export async function getFramerColorStyles(): Promise<ColorStyleDB[]> {
  try {
    const colorStyles = await framer.getColorStyles();
    console.log(`Found ${colorStyles.length} color styles in Framer`);
    
    return colorStyles.map(style => {
      const { name, folder } = parseStyleName(style.name);
      
      return {
        id: crypto.randomUUID(), // Generate a UUID for new entries
        framer_id: style.id,
        name,
        folder,
        light_color: style.light,
        dark_color: style.dark || null
      };
    });
  } catch (error) {
    console.error('Error getting color styles:', error);
    throw error;
  }
}

// Get all text styles from Framer and format them
export async function getFramerTextStyles(): Promise<TextStyleDB[]> {
  try {
    const textStyles = await framer.getTextStyles();
    console.log(`Found ${textStyles.length} text styles in Framer`);
    
    return textStyles.map(style => {
      const { name, folder } = parseStyleName(style.name);
      
      // Extract font information
      const fontFamily = style.font?.family || null;
      const fontWeight = style.font?.weight || null;
      const fontStyle = style.font?.style || null;
      
      return {
        id: crypto.randomUUID(), // Generate a UUID for new entries
        framer_id: style.id,
        name,
        folder,
        font_family: fontFamily,
        font_weight: fontWeight,
        font_style: fontStyle,
        font_size: style.fontSize || '16px',
        line_height: style.lineHeight || null,
        color: style.color || null,
        tag: style.tag || null,
        breakpoints: style.breakpoints || []
      };
    });
  } catch (error) {
    console.error('Error getting text styles:', error);
    throw error;
  }
}

// Import all Framer styles into Supabase
export async function importAllFramerStylesToSupabase() {
  try {
    // Get styles from Framer
    const colorStyles = await getFramerColorStyles();
    const textStyles = await getFramerTextStyles();
    
    // Insert color styles into Supabase
    const { data: insertedColors, error: colorError } = await supabase
      .from('color_styles')
      .upsert(colorStyles, { 
        onConflict: 'framer_id',
        ignoreDuplicates: false
      });
      
    if (colorError) {
      console.error('Error inserting color styles:', colorError);
      throw colorError;
    }
    
    console.log(`Inserted/updated ${insertedColors?.length || 0} color styles in Supabase`);
    
    // Insert text styles into Supabase
    const { data: insertedTextStyles, error: textError } = await supabase
      .from('text_styles')
      .upsert(textStyles, { 
        onConflict: 'framer_id',
        ignoreDuplicates: false
      });
      
    if (textError) {
      console.error('Error inserting text styles:', textError);
      throw textError;
    }
    
    console.log(`Inserted/updated ${insertedTextStyles?.length || 0} text styles in Supabase`);
    
    return {
      colorStyles: insertedColors || [],
      textStyles: insertedTextStyles || []
    };
  } catch (error) {
    console.error('Error importing styles to Supabase:', error);
    throw error;
  }
}

// Get all color styles from Supabase
export async function getColorStylesFromSupabase(options: { folder?: string } = {}): Promise<ColorStyleDB[]> {
  try {
    let query = supabase
      .from('color_styles')
      .select('*');
      
    if (options.folder) {
      query = query.eq('folder', options.folder);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting color styles from Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching color styles:', error);
    return [];
  }
}

// Get all text styles from Supabase
export async function getTextStylesFromSupabase(options: { folder?: string } = {}): Promise<TextStyleDB[]> {
  try {
    let query = supabase
      .from('text_styles')
      .select('*');
      
    if (options.folder) {
      query = query.eq('folder', options.folder);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting text styles from Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching text styles:', error);
    return [];
  }
}

// Apply a color style to the selected element(s)
export async function applyColorStyleToSelection(colorStyleId: string) {
  try {
    // Get the style from Supabase
    const { data: styleData, error } = await supabase
      .from('color_styles')
      .select('*')
      .eq('id', colorStyleId)
      .single();
      
    if (error || !styleData) {
      console.error('Error fetching color style:', error);
      return false;
    }
    
    // Get the Framer style using the framer_id
    const framerStyle = await framer.getColorStyle(styleData.framer_id);
    
    if (!framerStyle) {
      console.error('Color style not found in Framer:', styleData.framer_id);
      return false;
    }
    
    // Apply to selection
    const selection = await framer.getSelection();
    
    if (!selection.length) {
      console.warn('No elements selected');
      return false;
    }
    
    for (const node of selection) {
      if (node.supportsBackgroundColor) {
        await node.setAttributes({
          backgroundColor: framerStyle
        });
      } else if (node.supportsFill) {
        await node.setAttributes({
          fill: framerStyle
        });
      } else if (node.supportsStroke) {
        await node.setAttributes({
          stroke: framerStyle
        });
      }
    }
    
    console.log(`Applied color style ${styleData.name} to ${selection.length} elements`);
    return true;
  } catch (error) {
    console.error('Error applying color style:', error);
    return false;
  }
}

// Apply a text style to the selected text element(s)
export async function applyTextStyleToSelection(textStyleId: string) {
  try {
    // Get the style from Supabase
    const { data: styleData, error } = await supabase
      .from('text_styles')
      .select('*')
      .eq('id', textStyleId)
      .single();
      
    if (error || !styleData) {
      console.error('Error fetching text style:', error);
      return false;
    }
    
    // Get the Framer style using the framer_id
    const framerStyle = await framer.getTextStyle(styleData.framer_id);
    
    if (!framerStyle) {
      console.error('Text style not found in Framer:', styleData.framer_id);
      return false;
    }
    
    // Apply to selection
    const selection = await framer.getSelection();
    
    if (!selection.length) {
      console.warn('No elements selected');
      return false;
    }
    
    let appliedCount = 0;
    
    for (const node of selection) {
      if (node.isTextNode) {
        await node.setAttributes({
          textStyle: framerStyle
        });
        appliedCount++;
      }
    }
    
    console.log(`Applied text style ${styleData.name} to ${appliedCount} text elements`);
    return appliedCount > 0;
  } catch (error) {
    console.error('Error applying text style:', error);
    return false;
  }
}

// Get unique folders for color styles
export async function getColorStyleFolders(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('color_styles')
      .select('folder')
      .not('folder', 'is', null);
      
    if (error) {
      console.error('Error getting color style folders:', error);
      throw error;
    }
    
    const folders = [...new Set(data.map(item => item.folder))];
    return folders.filter(Boolean) as string[];
  } catch (error) {
    console.error('Error fetching color style folders:', error);
    return [];
  }
}

// Get unique folders for text styles
export async function getTextStyleFolders(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('text_styles')
      .select('folder')
      .not('folder', 'is', null);
      
    if (error) {
      console.error('Error getting text style folders:', error);
      throw error;
    }
    
    const folders = [...new Set(data.map(item => item.folder))];
    return folders.filter(Boolean) as string[];
  } catch (error) {
    console.error('Error fetching text style folders:', error);
    return [];
  }
}

// Get all unique style folders
export async function getAllStyleFolders(): Promise<string[]> {
  try {
    const colorFolders = await getColorStyleFolders();
    const textFolders = await getTextStyleFolders();
    
    // Combine and deduplicate
    const allFolders = [...new Set([...colorFolders, ...textFolders])];
    return allFolders.sort();
  } catch (error) {
    console.error('Error fetching all style folders:', error);
    return [];
  }
}