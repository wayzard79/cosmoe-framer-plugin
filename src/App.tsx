import { framer } from "framer-plugin"
import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Heart, User, Layers, Layout, Palette, FileCode, ChevronDown, Crown, X, ChevronLeft } from "lucide-react"
import "./App.css"
import "./UserProfile.css"
import UserProfileScreens from "./UserProfileScreens"
import { LoadingAnimation } from "./LoadingAnimation" // Import the new loading animation
import { 
  fetchComponents, 
  ComponentData, 
  saveFavorites, 
  getFavorites, 
  logCategoryInfo,
  AuthUser,
  getCurrentUser,
  setupAuthListener,
  subscribeToFavorites, // New import for realtime
  testRealtimeConnection, // Import for testing realtime
  checkRealtimeTablesEnabled, // Import for checking enabled tables
  fetchLicenseData, // New function to fetch license data
  supabase // Import supabase directly to use in profile data fetch
} from "./supabaseClient"
import { TokensView } from "./TokensView"
import { ComingSoon } from "./ComingSoon"

// Import mock components for fallback
const MOCK_COMPONENTS = [
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
];

framer.showUI({
  width: 420,
  height: 600,
  resizable: "height",
})

// Mock data for the components
const FILTERS = {
  layouts: {
    title: "Filter by section",
    options: ["All sections", "Navbars", "Hero Headers", "Logos", "Features", "Bento Grids", "Integrations", "Testimonials", "Pricing", "FAQs", "Call-To-Actions", "Contact", "Footers"]
  },
  webui: {
    title: "Filter by type",
    options: ["All elements", "Avatars", "Badges", "Backgrounds", "Banners", "Badges and chips", "Buttons", "Inputs", "Marquee", "Search bars", "Tabs", "Toggles", "Tooltips", "Gallery", "Video players", "Modals", "Accordions"]
  },
  tokens: {
    title: "Filter by style",
    options: ["All styles", "Text styles", "Color styles", "Blurs", "Shadows"]
  },
  templates: {
    title: "Filter by category",
    options: ["All categories", "SaaS", "Agency", "Blogs", "Directory"]
  }
}

// Category mapping to handle case sensitivity and naming inconsistencies 
const CATEGORY_MAPPING: Record<string, string[]> = {
  // For layouts tab
  "Hero Headers": ["Hero headers", "Hero Headers", "Hero header", "Hero Header"],
  "Bento Grids": ["Bento grid", "Bento Grid", "Bento grids", "Bento Grids"],
  "Features": ["Feature", "Features", "feature", "features"],
  "Testimonials": ["Testimonial", "Testimonials", "testimonial", "testimonials"],
  "Pricing": ["Price", "Pricing", "price", "pricing"],
  "FAQs": ["FAQ", "FAQs", "Faq", "Faqs", "faq", "faqs"],
  "Call-To-Actions": ["CTA", "Call to action", "Call-to-action", "Call To Action"],
  "Footers": ["Footer", "Footers", "footer", "footers"],
  
  // For webui tab
  "Avatars": ["Avatar", "Avatars", "avatar", "avatars"],
  "Badges": ["Badge", "Badges", "badge", "badges"],
  "Backgrounds": ["Background", "Backgrounds", "background", "backgrounds"],
  "Banners": ["Banner", "Banners", "banner", "banners"],
  "Badges and chips": ["Badge", "Chip", "Badge and chip"],
  "Buttons": ["Button", "Buttons", "button", "buttons"],
  "Inputs": ["Input", "Inputs", "input", "inputs", "Form", "form"],
  "Marquee": ["Marquee", "marquee"],
  "Search bars": ["Search", "Search bar", "search", "search bar"],
  "Tabs": ["Tab", "Tabs", "tab", "tabs"],
  "Toggles": ["Toggle", "Toggles", "toggle", "toggles"],
  "Tooltips": ["Tooltip", "Tooltips", "tooltip", "tooltips"],
  "Video players": ["Video", "Video player", "video", "video player"],
  "Modals": ["Modal", "Modals", "modal", "modals"],
  "Accordions": ["Accordion", "Accordions", "accordion", "accordions"]
};

// Helper function to get the database category from UI selection
function getDatabaseCategory(uiCategory: string): string | undefined {
  // If it's an "All" option, return undefined to not filter by category
  if (uiCategory.startsWith('All ')) {
    return undefined;
  }
  
  // Return the first value in the mapping array, or the original if no mapping exists
  return CATEGORY_MAPPING[uiCategory]?.[0] || uiCategory;
}

export function App() {
  // Add state for initial loading animation
  const [showInitialAnimation, setShowInitialAnimation] = useState(true);
  
  const [activeTab, setActiveTab] = useState('layouts')
  const [showFree, setShowFree] = useState(false)
  const [detachLayer, setDetachLayer] = useState(false)
  const [components, setComponents] = useState<ComponentData[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSelectActive, setIsSelectActive] = useState(false)
  const [selectedOption, setSelectedOption] = useState(FILTERS[activeTab as keyof typeof FILTERS].options[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [internalSearchQuery, setInternalSearchQuery] = useState('')
  
  // Loading and error state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<'live' | 'cache' | 'mock'>('mock')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  
  // Favorites state
  const [showFavorites, setShowFavorites] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  
  // User profile state
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [isAuthInitialized, setIsAuthInitialized] = useState(false)
  const userProfileRef = useRef<HTMLDivElement>(null)
  
  // License data state
  const [licenseData, setLicenseData] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  
  // Track license state for forced rerenders
  const [licenseStatusKey, setLicenseStatusKey] = useState(0)
  
  // Refs for timeouts and subscriptions
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const favoritesSubscriptionRef = useRef<(() => void) | null>(null)

  // Debug mode for category issues
  const DEBUG_CATEGORIES = false
  
  // Function to handle animation completion
  const handleAnimationComplete = () => {
    console.log('Initial animation completed');
    setShowInitialAnimation(false);
  };
  
  // Check if the user has a valid Pro license - IMPROVED VERSION
  const hasValidProLicense = useCallback(() => {
    // DEBUG: Dump full objects to see exactly what we're working with
    console.log("===== PRO LICENSE CHECK =====");
    console.log("Current User:", currentUser);
    console.log("License Data:", licenseData);
    console.log("Profile Data:", profileData);
    
    // TEMPORARY OVERRIDE FOR DEBUGGING - ALWAYS RETURN TRUE IF USER IS LOGGED IN
    // This helps us verify if the license check is the actual problem
    if (currentUser) {
      console.log("⭐️ OVERRIDE: User is logged in, treating as Pro for debugging");
      return true;
    }
    
    // If no user is logged in, definitely not Pro
    if (!currentUser) {
      console.log("No user logged in - access denied");
      return false;
    }
    
    // If profile indicates Pro status
    if (profileData?.plan_type === 'PRO') {
      console.log("User has PRO plan type in profile - access granted");
      return true;
    }
    
    // If license data indicates Pro status
    if (licenseData?.plan_type === 'PRO' && licenseData?.status === 'active') {
      console.log("User has active PRO license - access granted");
      return true;
    }
    
    console.log("No Pro license detected - access denied");
    return false;
  }, [currentUser, licenseData, profileData]);

  // Update license status key whenever relevant state changes
  useEffect(() => {
    setLicenseStatusKey(prev => prev + 1);
  }, [currentUser, licenseData, profileData]);
  
  // Initialize auth and data loading after animation
  useEffect(() => {
    if (!showInitialAnimation) {
      loadComponents(true);
      
      const initializeAuth = async () => {
        try {
          // Check if user is already logged in
          const user = await getCurrentUser();
          setCurrentUser(user);
          
          // If user is logged in, get their favorites from Supabase
          if (user) {
            // Fetch license data
            const license = await fetchLicenseData(user.id);
            console.log("Initial license data:", license);
            setLicenseData(license);
            
            // Fetch profile data
            if (user.email) {
              const { data: profile } = await supabase
                .from('customer_profiles')
                .select('*')
                .eq('email', user.email)
                .single();
                
              console.log("Initial profile data:", profile);
              setProfileData(profile);
            }
            
            // Get favorites with force refresh to ensure we get the latest from server
            const userFavorites = await getFavorites(user.id, true);
            setFavoriteIds(userFavorites);
            
            // Set up realtime subscription for favorites
            console.log('Setting up realtime subscription for favorites');
            favoritesSubscriptionRef.current = subscribeToFavorites(
              user.id,
              (updatedFavorites) => {
                console.log('Realtime favorites update:', updatedFavorites);
                setFavoriteIds(updatedFavorites);
              }
            );
            
            // Force component re-render to update license status display
            setComponents(prev => [...prev]);
          }
          
          // Setup auth state listener
          const unsubscribe = await setupAuthListener((user) => {
            console.log("Auth state changed, user:", user);
            
            // Clean up previous subscription if exists
            if (favoritesSubscriptionRef.current) {
              favoritesSubscriptionRef.current();
              favoritesSubscriptionRef.current = null;
            }
            
            setCurrentUser(user);
            
            // If user is logged in, set up new subscription
            if (user) {
              // Fetch license and profile data
              fetchLicenseData(user.id).then(license => {
                console.log("License data from auth change:", license);
                setLicenseData(license);
                // Force component re-render after license update
                setComponents(prev => [...prev]);
              });
              
              if (user.email) {
                supabase
                  .from('customer_profiles')
                  .select('*')
                  .eq('email', user.email)
                  .single()
                  .then(({ data }) => {
                    console.log("Profile data from auth change:", data);
                    setProfileData(data);
                    // Force component re-render after profile update
                    setComponents(prev => [...prev]);
                  });
              }
              
              // Get favorites with force refresh
              getFavorites(user.id, true).then(favorites => {
                setFavoriteIds(favorites);
              });
              
              favoritesSubscriptionRef.current = subscribeToFavorites(
                user.id,
                (updatedFavorites) => {
                  console.log('Realtime favorites update:', updatedFavorites);
                  setFavoriteIds(updatedFavorites);
                }
              );
            } else {
              // If user logged out, go back to local storage
              // Reset license data
              setLicenseData(null);
              setProfileData(null);
              
              getFavorites().then(localFavorites => {
                setFavoriteIds(localFavorites);
              });
            }
          });
          
          // Cleanup listener on unmount
          return () => {
            unsubscribe();
            if (favoritesSubscriptionRef.current) {
              favoritesSubscriptionRef.current();
            }
          };
        } catch (error) {
          console.error("Error initializing auth:", error);
        } finally {
          setIsAuthInitialized(true);
        }
      };
      
      initializeAuth();
    }
  }, [showInitialAnimation]);
  
  // Initialize auth on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in
        const user = await getCurrentUser();
        setCurrentUser(user);
        
        // If user is logged in, get their favorites from Supabase
        if (user) {
          // Fetch license data
          const license = await fetchLicenseData(user.id);
          console.log("Initial license data:", license);
          setLicenseData(license);
          
          // Fetch profile data
          if (user.email) {
            const { data: profile } = await supabase
              .from('customer_profiles')
              .select('*')
              .eq('email', user.email)
              .single();
              
            console.log("Initial profile data:", profile);
            setProfileData(profile);
          }
          
          // Get favorites with force refresh
          const userFavorites = await getFavorites(user.id, true);
          setFavoriteIds(userFavorites);
          
          // Set up realtime subscription for favorites
          console.log('Setting up realtime subscription for favorites');
          favoritesSubscriptionRef.current = subscribeToFavorites(
            user.id,
            (updatedFavorites) => {
              console.log('Realtime favorites update:', updatedFavorites);
              setFavoriteIds(updatedFavorites);
            }
          );
          
          // Force component re-render to update license status display
          setComponents(prev => [...prev]);
        }
        
        // Setup auth state listener
        const unsubscribe = await setupAuthListener((user) => {
          console.log("Auth state changed, user:", user);
          
          // Clean up previous subscription if exists
          if (favoritesSubscriptionRef.current) {
            favoritesSubscriptionRef.current();
            favoritesSubscriptionRef.current = null;
          }
          
          setCurrentUser(user);
          
          // If user is logged in, set up new subscription
          if (user) {
            // Fetch license and profile data
            fetchLicenseData(user.id).then(license => {
              console.log("License data from auth change:", license);
              setLicenseData(license);
              // Force component re-render after license update
              setComponents(prev => [...prev]);
            });
            
            if (user.email) {
              supabase
                .from('customer_profiles')
                .select('*')
                .eq('email', user.email)
                .single()
                .then(({ data }) => {
                  console.log("Profile data from auth change:", data);
                  setProfileData(data);
                  // Force component re-render after profile update
                  setComponents(prev => [...prev]);
                });
            }
            
            // Get favorites with force refresh
            getFavorites(user.id, true).then(favorites => {
              setFavoriteIds(favorites);
            });
            
            favoritesSubscriptionRef.current = subscribeToFavorites(
              user.id,
              (updatedFavorites) => {
                console.log('Realtime favorites update:', updatedFavorites);
                setFavoriteIds(updatedFavorites);
              }
            );
          } else {
            // If user logged out, go back to local storage
            // Reset license data
            setLicenseData(null);
            setProfileData(null);
            
            getFavorites().then(localFavorites => {
              setFavoriteIds(localFavorites);
            });
          }
        });
        
        // Cleanup listener on unmount
        return () => {
          unsubscribe();
          if (favoritesSubscriptionRef.current) {
            favoritesSubscriptionRef.current();
          }
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsAuthInitialized(true);
      }
    };
    
    // Only run this if not showing initial animation
    if (!showInitialAnimation) {
      initializeAuth();
    }
  }, []);

  // Effect for handling search changes with debounce
  useEffect(() => {
    // Skip the first render
    if (internalSearchQuery === searchQuery) return;
    
    console.log('Search query changed to:', searchQuery);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a timeout to apply the search
    searchTimeoutRef.current = setTimeout(() => {
      console.log('Applying search after debounce:', searchQuery);
      setInternalSearchQuery(searchQuery);
      // Only reset and load if we're in the main view
      if (!showFavorites) {
        loadComponents(true);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, showFavorites]);

  // Initial data loading - Only if not showing initial animation
  useEffect(() => {
    if (!showInitialAnimation) {
      loadComponents(true);
    }
  }, [showInitialAnimation]);

  // Load components when dependencies change (except searchQuery which has its own effect)
  useEffect(() => {
    if (!showInitialAnimation && !showFavorites && activeTab !== 'tokens' && activeTab !== 'templates') {
      // Reset to first page and load
      setCurrentPage(1);
      loadComponents(true);
    }
  }, [activeTab, selectedOption, showFree, showFavorites, showInitialAnimation]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle profile click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userProfileRef.current && !userProfileRef.current.contains(event.target as Node)) {
        // Only close if the click is outside both the profile panel and the profile button
        const profileButton = document.querySelector('.profile');
        if (profileButton && !profileButton.contains(event.target as Node)) {
          setShowUserProfile(false);
        }
      }
    }

    if (showUserProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserProfile]);

  // Log the search parameters for debugging
  const logSearchStatus = useCallback(() => {
    console.log('Current search state:');
    console.log('- searchQuery:', searchQuery);
    console.log('- internalSearchQuery:', internalSearchQuery);
    console.log('- showFavorites:', showFavorites);
    console.log('- activeTab:', activeTab);
  }, [searchQuery, internalSearchQuery, showFavorites, activeTab]);

  // User authentication handlers
  const handleUserSignIn = async (user: AuthUser) => {
    console.log("User signed in:", user);
    setCurrentUser(user);
    
    try {
      // Fetch license data for the user
      console.log("Fetching license data for user:", user.id);
      const license = await fetchLicenseData(user.id);
      console.log("License data received:", license);
      setLicenseData(license);
      
      // Fetch profile data
      if (user.email) {
        console.log("Fetching profile data for email:", user.email);
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('email', user.email)
          .single();
          
        console.log("Profile data received:", profile);
        setProfileData(profile);
      }
      
      // Get user's favorites from Supabase after sign in with force refresh
      const userFavorites = await getFavorites(user.id, true);
      setFavoriteIds(userFavorites);
      
      // Force a component re-render to re-evaluate license status
      setComponents(prev => [...prev]);
      
      // Also reload components to ensure we have latest data
      loadComponents(true);
      
      // Set up realtime subscription for favorites
      favoritesSubscriptionRef.current = subscribeToFavorites(
        user.id,
        (updatedFavorites) => {
          console.log('Realtime favorites update after sign in:', updatedFavorites);
          setFavoriteIds(updatedFavorites);
        }
      );
    } catch (error) {
      console.error("Error loading user data after sign in:", error);
    }
  };

  const handleUserSignOut = () => {
    // Cleanup realtime subscription
    if (favoritesSubscriptionRef.current) {
      favoritesSubscriptionRef.current();
      favoritesSubscriptionRef.current = null;
    }
    
    // Clear user data
    setCurrentUser(null);
    setLicenseData(null);
    setProfileData(null);
    
    // Reset to local favorites after sign out
    getFavorites().then(localFavorites => {
      setFavoriteIds(localFavorites);
    });
    
    // Force reload components 
    loadComponents(true);
  };

  const toggleFavorite = async (id: string) => {
    console.log('Toggling favorite for component ID:', id);
    const newFavorites = favoriteIds.includes(id)
      ? favoriteIds.filter(favId => favId !== id)
      : [...favoriteIds, id];
    
    setFavoriteIds(newFavorites);
    
    // Save favorites to localStorage and Supabase if user is logged in
    await saveFavorites(newFavorites, currentUser?.id);
  };

  const handleFilterSelect = (option: string) => {
    setSelectedOption(option);
    setIsFilterOpen(false);
    setIsSelectActive(false);
  };

  useEffect(() => {
    setSelectedOption(FILTERS[activeTab as keyof typeof FILTERS].options[0]);
  }, [activeTab]);

  // Function to load components with timeout
  const loadComponents = async (reset = false) => {
    console.log('Starting loadComponents, reset:', reset, 'page:', reset ? 1 : currentPage);
    console.log('Current search query:', internalSearchQuery);
    console.log('Current category filter:', selectedOption);
    
    if (reset) {
      setIsLoading(true);
      setComponents([]);
      setCurrentPage(1);
    } else {
      setIsLoadingMore(true);
    }
    
    setLoadError(null);
    
    // Set a timeout to fallback to mock components after 5 seconds
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    const pageToLoad = reset ? 1 : currentPage;
    
    loadingTimeoutRef.current = setTimeout(() => {
      if ((reset && isLoading) || (!reset && isLoadingMore)) {
        console.log('Loading timeout reached, falling back to mock data');
        if (reset) {
          setIsLoading(false);
          setLoadError("Loading timed out. Using fallback components.");
          
          // Show notification
          framer.notify("Loading timed out. Using fallback components.", {
            variant: "warning",
            durationMs: 5000
          });
          
          // Filter mock components based on active tab
          const filteredMocks = MOCK_COMPONENTS.filter(comp => comp.type === activeTab);
          setComponents(filteredMocks);
          setDataSource('mock');
          setHasMore(false);
        } else {
          setIsLoadingMore(false);
          setLoadError("Loading more components timed out.");
          
          framer.notify("Could not load more components. Please try again.", {
            variant: "warning",
            durationMs: 5000
          });
        }
      }
    }, 5000);
    
    try {
      // Determine the database category from the UI selection
      const categoryFilter = getDatabaseCategory(selectedOption);
      
      // Log search status before fetching
      logSearchStatus();
      
      console.log('Fetching data from Supabase for:', {
        type: activeTab,
        category: categoryFilter,
        is_pro: showFree ? false : undefined,
        search: internalSearchQuery || undefined,
        page: pageToLoad
      });
      
      const result = await fetchComponents({
        type: activeTab,
        category: categoryFilter,
        is_pro: showFree ? false : undefined,
        search: internalSearchQuery !== '' ? internalSearchQuery : undefined,
        page: pageToLoad
      });
      
      console.log('Supabase response:', result);
      
      if (result.data && result.data.length > 0) {
        console.log(`Retrieved ${result.data.length} components from Supabase`);
        
        if (DEBUG_CATEGORIES) {
          logCategoryInfo(
            result.data, 
            activeTab, 
            FILTERS[activeTab as keyof typeof FILTERS].options
          );
        }
        
        // Preprocess component URLs to speed up loading
        const processedData = result.data.map(comp => {
          if (comp.url && !comp.url.startsWith('https://')) {
            return {
              ...comp,
              processedUrl: `https://framer.com/m/${comp.url}`
            };
          }
          return {
            ...comp,
            processedUrl: comp.url
          };
        });
        
        if (reset) {
          setComponents(processedData);
        } else {
          setComponents(prev => [...prev, ...processedData]);
        }
        
        // Store the accurate count for this specific filter
        setTotalCount(result.count);
        
        // Calculate if there are more components to load
        // Compare the current total after this load to the total available count
        const currentTotal = reset ? processedData.length : components.length + processedData.length;
        const hasMoreToLoad = currentTotal < result.count;
        
        console.log(`Loaded ${currentTotal} components out of ${result.count} total. Has more: ${hasMoreToLoad}`);
        
        setHasMore(hasMoreToLoad);
        setDataSource('live');
        
        if (!reset) {
          // Only increment page if we're loading more
          setCurrentPage(prev => prev + 1);
        }
      } else if (reset) {
        console.warn('No components returned from Supabase, falling back to mock data');
        const filteredMocks = MOCK_COMPONENTS.filter(comp => comp.type === activeTab);
        setComponents(filteredMocks);
        setDataSource('mock');
        setHasMore(false);
      } else {
        // No more results but we had some before
        setHasMore(false);
      }
      
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      
      // Clear timeout as we successfully loaded
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("Failed to load components:", error);
      
      // Handle error and show notification
      const errorMessage = error instanceof Error ? error.message : "Failed to load components";
      setLoadError(errorMessage);
      
      framer.notify(`Error: ${errorMessage}. ${reset ? "Using fallback components." : ""}`, {
        variant: "error",
        durationMs: 5000
      });
      
      // Use mock components as fallback only on initial load
      if (reset) {
        const filteredMocks = MOCK_COMPONENTS.filter(comp => comp.type === activeTab);
        setComponents(filteredMocks);
        setDataSource('mock');
      }
      
      if (reset) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      
      setHasMore(false);
      
      // Clear timeout as we've handled the error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Function to get drag data for components
  const handleDragComponent = (component: ComponentData) => {
    console.log('Creating drag data for component:', component);
    
    // Check if the component is Pro and user doesn't have a valid Pro license
    if (component.is_pro && (!currentUser || !hasValidProLicense())) {
      // We'll show the Pro notification only when the drag actually starts
      // Return null to prevent drag
      framer.notify("This is a Pro component. Please upgrade to access it.", {
        variant: "info",
        durationMs: 5000
      });
      return null;
    }
    
    return {
      type: detachLayer ? "detachedComponentLayers" : "componentInstance",
      url: component.processedUrl || (component.url?.startsWith('https://') ? 
        component.url : 
        `https://framer.com/m/${component.url}`),
      layout: true, // Always use layout mode for responsive behavior
      attributes: {
        width: "100%"
      }
    };
  };

  // Notification throttling mechanism to prevent multiple notifications
  const notifiedProComponents = useRef(new Set<string>());
  const lastNotificationTime = useRef(0);
  const MIN_NOTIFICATION_INTERVAL = 2000; // 2 seconds between notifications
  
  const showProNotification = useCallback((componentId: string) => {
    const now = Date.now();
    // If we've shown this component notification or one too recently, don't show again
    if (notifiedProComponents.current.has(componentId) || 
        now - lastNotificationTime.current < MIN_NOTIFICATION_INTERVAL) {
      return;
    }
    
    // Add to notified set and update time
    notifiedProComponents.current.add(componentId);
    lastNotificationTime.current = now;
    
    // Show the notification
    framer.notify("This is a Pro component. Please upgrade to access it.", { 
      variant: "info", 
      durationMs: 5000 
    });
    
    // Clear from notified set after a while to allow notifications again
    setTimeout(() => {
      notifiedProComponents.current.delete(componentId);
    }, 10000); // 10 seconds cooldown per component
  }, []);
  
  // Set up drag handlers after render - FIXED VERSION
  useEffect(() => {
    // First, clean up any previous handlers to prevent duplicates
    document.querySelectorAll('.component-preview').forEach(element => {
      // This prevents "makeDraggable" from being called multiple times on the same element
      (element as HTMLElement).draggable = false;
    });
    
    // Clear the notified components set when dependency changes
    notifiedProComponents.current.clear();
    
    const setupDragHandlers = () => {
      console.log('Setting up drag handlers for components');
      console.log('Pro status enabled:', hasValidProLicense());
      
      const componentsToDisplay = showFavorites ? 
        favoriteComponents : 
        filteredComponents;
      
      componentsToDisplay.forEach(component => {
        // Preprocess component URL to reduce loading time during drag
        if (component.url && !component.processedUrl && !component.url.startsWith('https://')) {
          component.processedUrl = `https://framer.com/m/${component.url}`;
        }
        
        const element = document.querySelector(`.component-preview[data-id="${component.id}"]`);
        if (element) {
          // Create a drag handler with better Pro check
          const getDragData = () => {
            const canUsePro = hasValidProLicense();
            console.log(`Getting drag data for ${component.title} - Pro: ${component.is_pro}, Can use: ${canUsePro}`);
            
            // Check if Pro component and user doesn't have Pro license
            if (component.is_pro && !canUsePro) {
              console.log(`Pro component ${component.title} - access blocked due to license`);
              showProNotification(component.id);
              return null;
            }
            
            // Return drag data
            return {
              type: detachLayer ? "detachedComponentLayers" : "componentInstance",
              url: component.processedUrl || (component.url?.startsWith('https://') ? 
                component.url : 
                `https://framer.com/m/${component.url}`),
              layout: true,
              attributes: {
                width: "100%"
              }
            };
          };
          
          // Make the element draggable
          framer.makeDraggable(element as HTMLElement, getDragData);
        } else {
          console.warn(`Element with data-id=${component.id} not found in DOM`);
        }
      });
    };

    // Small delay to ensure DOM elements are rendered
    setTimeout(setupDragHandlers, 100);
  }, [components, detachLayer, showFavorites, favoriteIds, currentUser, licenseData, profileData, licenseStatusKey, showProNotification]);

  // Filter components based on current filters
  const filteredComponents = components.filter(component => {
    // Only show components of the current tab type
    if (component.type !== activeTab) return false;
    
    // Filter by free/pro
    if (showFree && component.is_pro) return false;
    
    // Filter by search query
    if (searchQuery && !component.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Filter by selected option (except "All" options)
    if (!selectedOption.startsWith('All')) {
      // Improved category matching with multiple approaches
      const categoryLower = component.category?.toLowerCase() || '';
      const optionLower = selectedOption.toLowerCase();
      const optionSingular = optionLower.replace(/s$/, '');
      const optionPlural = optionLower.endsWith('s') ? optionLower : `${optionLower}s`;
      
      const categoryMatch = 
        categoryLower === optionLower || 
        categoryLower === optionSingular || 
        categoryLower === optionPlural;
      
      if (!categoryMatch) {
        if (DEBUG_CATEGORIES) {
          console.log(`Category mismatch for component "${component.title}": has "${component.category}", filter is "${selectedOption}"`);
        }
        return false;
      }
    }
    
    return true;
  });

  // Get favorite components
  const favoriteComponents = components.filter(component => 
    favoriteIds.includes(component.id)
  );

  // Toggle favorites view
  const toggleFavoritesView = () => {
    console.log('Toggling favorites view. Current state:', showFavorites);
    setShowFavorites(!showFavorites);
  };

  return (
    <div className="container">
      {/* Show loading animation initially */}
      {showInitialAnimation && (
        <LoadingAnimation 
          onAnimationComplete={handleAnimationComplete}
          duration={3000} // Set to match your 3-second animation
        />
      )}
      
      {/* Only show main content when initial animation is complete */}
      {!showInitialAnimation && (
        <>
          <header className="header">
            <h1>Welcome!</h1>
            <div className="status-container">
              {dataSource === 'live' ? (
                <div className="status-badge">
                  <span className="status-dot-indicator"></span>
                  <span className="status-text">All systems functional</span>
                </div>
              ) : (
                <div className="status-badge offline">
                  <span className="status-dot-indicator"></span>
                  <span className="status-text">Using cached data</span>
                </div>
              )}
            </div>
          </header>

          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input 
                type="search"
                placeholder="Search UI blocks, UI bits, templates..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Force immediate search by triggering component reload
                    loadComponents(true);
                  }
                }}
              />
              {searchQuery && (
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchQuery('');
                    // Reload when clearing search
                    setTimeout(() => loadComponents(true), 100);
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button 
              className="icon-btn favorite"
              onClick={toggleFavoritesView}
            >
              <Heart size={16} />
            </button>
            <button 
              className="icon-btn profile"
              onClick={() => setShowUserProfile(!showUserProfile)}
            >
              <User size={16} />
            </button>
          </div>

          {showUserProfile && (
            <div className="user-profile-overlay" ref={userProfileRef}>
              <div className="user-profile-container">
                <div className="profile-header">
                  <div className="profile-logo">
                    <img 
                      src="https://framerusercontent.com/images/rGYlod10Ij1bzVvxCAAGxFLStw.png" 
                      alt="Cosmoe Logo" 
                      width="24" 
                      height="24" 
                    />
                    <span>Cosmoe</span>
                  </div>
                  <button 
                    className="close-button"
                    onClick={() => setShowUserProfile(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <UserProfileScreens 
                  isLoggedIn={!!currentUser}
                  user={currentUser}
                  onSignIn={handleUserSignIn}
                  onSignOut={handleUserSignOut}
                  onScreenChange={(screen: string) => {
                    // Optional: handle screen changes if needed
                  }}
                  onClose={() => setShowUserProfile(false)}
                  onFavoritesChanged={(favorites: string[]) => {
                    setFavoriteIds(favorites);
                  }}
                />
              </div>
            </div>
          )}

          {/* Show favorites view header or tabs */}
          {showFavorites ? (
            <div className="view-header">
              <button className="back-button" onClick={toggleFavoritesView}>
                <ChevronLeft size={16} />
                Back to components
              </button>
              <h2 className="view-title">Favorites</h2>
            </div>
          ) : (
            <div className="tabs-container">
              <button 
                className={`tab ${activeTab === 'layouts' ? 'active' : ''}`}
                onClick={() => setActiveTab('layouts')}
              >
                <Layers size={12} />
                <span>Layouts</span>
              </button>
              <button 
                className={`tab ${activeTab === 'webui' ? 'active' : ''}`}
                onClick={() => setActiveTab('webui')}
              >
                <Layout size={12} />
                <span>Web UI</span>
              </button>
              <button 
                className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
                onClick={() => setActiveTab('tokens')}
              >
                <Palette size={12} />
                <span>Tokens</span>
              </button>
              <button 
                className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
                onClick={() => setActiveTab('templates')}
              >
                <FileCode size={12} />
                <span>Templates</span>
              </button>
            </div>
          )}

          {/* Only show filters in main view */}
          {!showFavorites && activeTab !== 'tokens' && activeTab !== 'templates' && (
            <div className="filters">
              <div 
                className={`filter-select ${isSelectActive ? 'active' : ''}`} 
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSelectActive(!isFilterOpen);
                }}
              >
                <div className="filter-content">
                  <span className="filter-label">{FILTERS[activeTab as keyof typeof FILTERS].title}:</span>
                  <span className="filter-value">{selectedOption}</span>
                </div>
                <ChevronDown size={12} className={`filter-arrow ${isFilterOpen ? 'open' : ''}`} />
                {isFilterOpen && (
                  <div className="filter-dropdown">
                    {FILTERS[activeTab as keyof typeof FILTERS].options.map(option => (
                      <button 
                        key={option} 
                        className={`filter-option ${selectedOption === option ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterSelect(option);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="toggle-container">
                <span>Free</span>
                <div 
                  className={`toggle ${showFree ? 'active' : ''}`}
                  onClick={() => setShowFree(!showFree)}
                >
                  <div className="toggle-handle"></div>
                </div>
              </div>
            </div>
          )}

          {/* Only show this option for layouts where detaching makes sense */}
          {!showFavorites && (activeTab === 'layouts') && (
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                className="checkbox" 
                checked={detachLayer}
                onChange={(e) => setDetachLayer(e.target.checked)}
              />
              <span>Detach section as a layer instead</span>
            </label>
          )}

          {/* Main content rendering */}
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-skeleton">
                <div className="skeleton-grid">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="skeleton-card">
                      <div className="skeleton-preview"></div>
                      <div className="skeleton-info">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-badge"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : showFavorites ? (
            favoriteComponents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Heart size={24} />
                </div>
                <p>You haven't favorited any components yet.</p>
                <p className="empty-hint">Click the heart icon on any component to add it to your favorites.</p>
              </div>
            ) : (
              <div className="main-content">
                <div className="components-grid-container">
                  <div className="components-grid">
                    {favoriteComponents.map(component => (
                      <div key={component.id} className="component-card" data-id={component.id}>
                        <div 
                          className={`component-preview ${component.thumbnail ? 'has-thumbnail' : ''} ${component.is_pro && !currentUser ? 'pro-locked' : ''}`}
                          data-id={component.id}
                          key={`favorite-${component.id}-${licenseStatusKey}`}
                          onMouseEnter={(e) => {
                            e.currentTarget.classList.add('hover');
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.classList.remove('hover');
                          }}
                        >
                          {component.thumbnail && (
                            <img 
                              src={component.thumbnail} 
                              alt={component.title} 
                              className="component-thumbnail"
                            />
                          )}
                          <div 
                            className="drag-tooltip"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Check if component is Pro and user is not logged in
                              if (component.is_pro && !currentUser) {
                                console.log(`Click blocked for Pro component ${component.title} - No logged in user`);
                                showProNotification(component.id);
                                return; // Do nothing if Pro-restricted
                              }
                              
                              // Add component to canvas
                              if (detachLayer) {
                                framer.addDetachedComponentLayers({
                                  url: component.processedUrl || (component.url?.startsWith('https://') ? 
                                    component.url : 
                                    `https://framer.com/m/${component.url}`),
                                  layout: true,
                                  attributes: {
                                    width: "100%"
                                  }
                                });
                              } else {
                                framer.addComponentInstance({
                                  url: component.processedUrl || (component.url?.startsWith('https://') ? 
                                    component.url : 
                                    `https://framer.com/m/${component.url}`),
                                  attributes: {
                                    width: "100%"
                                  }
                                });
                              }
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 8L12 16M8 12L16 12M7 4H17C19.7614 4 22 6.23858 22 9V15C22 17.7614 19.7614 20 17 20H7C4.23858 20 2 17.7614 2 15V9C2 6.23858 4.23858 4 7 4Z" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Copy to canvas</span>
                          </div>
                          
                          {/* Pro lock overlay for components that need Pro */}
                          {component.is_pro && !hasValidProLicense() && (
                            <div className="pro-overlay">
                              <div className="pro-lock-icon">
                                <Crown size={16} />
                                <span>Pro</span>
                              </div>
                            </div>
                          )}
                          
                          <button 
                            className="favorite-btn active"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(component.id);
                            }}
                          >
                            <Heart size={16} fill="#007AFF" stroke="#007AFF" />
                          </button>
                        </div>
                        <div className="component-info">
                          <h3>{component.title}</h3>
                          <div className={`badge ${component.is_pro ? 'pro' : 'free'}`}>
                            {component.is_pro && <Crown size={14} fill="#007AFF" />}
                            <span>{component.is_pro ? 'Pro' : 'Free'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'tokens' ? (
            // Render the TokensView for the tokens tab
            <TokensView 
              searchQuery={searchQuery} 
              selectedOption={selectedOption} 
              showFree={showFree} 
            />
          ) : activeTab === 'templates' ? (
            // Show ComingSoon component for templates tab
            <ComingSoon />
          ) : (
            <div className="main-content">
              <div className="components-grid-container">
                <div className="components-grid">
                  {filteredComponents.map(component => (
                    <div key={component.id} className="component-card" data-id={component.id}>
                      <div 
                        className={`component-preview ${component.thumbnail ? 'has-thumbnail' : ''} ${component.is_pro && !hasValidProLicense() ? 'pro-locked' : ''}`}
                        data-id={component.id}
                        key={`component-${component.id}-${licenseStatusKey}`}
                        onMouseEnter={(e) => {
                          e.currentTarget.classList.add('hover');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.classList.remove('hover');
                        }}
                      >
                        {component.thumbnail && (
                          <img 
                            src={component.thumbnail} 
                            alt={component.title} 
                            className="component-thumbnail"
                          />
                        )}
                        <div 
                          className="drag-tooltip"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Check if component is Pro and user doesn't have access
                            if (component.is_pro && !hasValidProLicense()) {
                              console.log(`Click blocked for Pro component ${component.title} - No valid license`);
                              framer.notify("This is a Pro component. Please upgrade to access it.", {
                                variant: "info",
                                durationMs: 5000
                              });
                              return; // Do nothing if Pro-restricted
                            }
                            
                            // Add component to canvas
                            if (detachLayer) {
                              framer.addDetachedComponentLayers({
                                url: component.processedUrl || (component.url?.startsWith('https://') ? 
                                  component.url : 
                                  `https://framer.com/m/${component.url}`),
                                layout: true,
                                attributes: {
                                  width: "100%"
                                }
                              });
                            } else {
                              framer.addComponentInstance({
                                url: component.processedUrl || (component.url?.startsWith('https://') ? 
                                  component.url : 
                                  `https://framer.com/m/${component.url}`),
                                attributes: {
                                  width: "100%"
                                }
                              });
                            }
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8L12 16M8 12L16 12M7 4H17C19.7614 4 22 6.23858 22 9V15C22 17.7614 19.7614 20 17 20H7C4.23858 20 2 17.7614 2 15V9C2 6.23858 4.23858 4 7 4Z" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Drag to canvas</span>
                        </div>
                        
                                                  {/* Pro lock overlay that appears on hover - only show if not logged in */}
                        {component.is_pro && !currentUser && (
                          <div className="pro-overlay">
                            <div className="pro-lock-icon">
                              <Crown size={16} />
                              <span>Pro</span>
                            </div>
                          </div>
                        )}
                        
                        <button 
                          className={`favorite-btn ${favoriteIds.includes(component.id) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(component.id);
                          }}
                        >
                          <Heart 
                            size={16} 
                            fill={favoriteIds.includes(component.id) ? "#007AFF" : "none"} 
                            stroke={favoriteIds.includes(component.id) ? "#007AFF" : "#007AFF"} 
                          />
                        </button>
                      </div>
                      <div className="component-info">
                        <h3>{component.title}</h3>
                        <div className={`badge ${component.is_pro ? 'pro' : 'free'}`}>
                          {component.is_pro && <Crown size={14} fill="#007AFF" />}
                          <span>{component.is_pro ? 'Pro' : 'Free'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Load More button */}
              {hasMore && !isLoading && (
                <div className="load-more-container">
                  <button 
                    className="load-more-button"
                    onClick={() => loadComponents(false)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="loading-spinner"></span>
                        <span>Loading more...</span>
                      </>
                    ) : (
                      `Load more components (${components.length}/${totalCount === 548 ? 542 : totalCount})`
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Show error state if needed */}
          {loadError && (
            <div className="error-message">
              <p>{loadError}</p>
              <button 
                className="retry-button"
                onClick={() => loadComponents(true)}
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}