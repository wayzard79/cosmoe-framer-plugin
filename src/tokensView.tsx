// TokensView.tsx
import React, { useState, useEffect } from 'react';
import { 
  getColorStylesFromSupabase, 
  getTextStylesFromSupabase,
  ColorStyleDB,
  TextStyleDB
} from './framerStylesService';
import { framer } from 'framer-plugin';
import { Heart, ChevronDown } from 'lucide-react';
import './TokensView.css';

interface TokensViewProps {
  searchQuery: string;
  selectedOption: string;
  showFree: boolean;
}

export function TokensView({ searchQuery, selectedOption, showFree }: TokensViewProps) {
  // State for styles
  const [colorStyles, setColorStyles] = useState<ColorStyleDB[]>([]);
  const [textStyles, setTextStyles] = useState<TextStyleDB[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // UI state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSelection, setFilterSelection] = useState('All styles');
  const [isSelectActive, setIsSelectActive] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Load styles on component mount
  useEffect(() => {
    loadStyles();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteStyles');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);
  
  // Update local search when prop search changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Update filter selection when selectedOption changes
  useEffect(() => {
    if (selectedOption) {
      setFilterSelection(selectedOption);
    }
  }, [selectedOption]);
  
  // Load styles from Supabase
  const loadStyles = async () => {
    setLoadingStyles(true);
    setError(null);
    
    try {
      // Get all styles
      const [colors, texts] = await Promise.all([
        getColorStylesFromSupabase(),
        getTextStylesFromSupabase()
      ]);
      
      setColorStyles(colors);
      setTextStyles(texts);
      
      console.log(`Loaded ${colors.length} color styles and ${texts.length} text styles`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading styles';
      setError(errorMessage);
      console.error('Error loading styles:', err);
    } finally {
      setLoadingStyles(false);
    }
  };
  
  // Toggle a style as favorite
  const toggleFavorite = (id: string) => {
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteStyles', JSON.stringify([...newFavorites]));
  };
  
  // Extract base color name from a style name
  const getBaseColorName = (styleName: string): string => {
    // Find number pattern at the end with a space before it
    const match = styleName.match(/^(.*?)(?:\s+\d+)?$/);
    return match ? match[1] : styleName;
  };
  
  // Group styles by color palette
  const groupStylesByPalette = (): Record<string, ColorStyleDB[]> => {
    const palettes: Record<string, ColorStyleDB[]> = {};
    
    // Group by base color name
    colorStyles.forEach(style => {
      // Filter by search
      if (localSearchQuery && !style.name.toLowerCase().includes(localSearchQuery.toLowerCase())) {
        return;
      }
      
      // Filter by free/pro if needed
      if (showFree && (style.folder?.toLowerCase().includes('pro') || style.name.toLowerCase().includes('pro'))) {
        return;
      }
      
      // Filter by selected style category
      if (filterSelection === 'Text styles') {
        return; // Skip color styles when text styles are selected
      }
      
      const baseColorName = getBaseColorName(style.name);
      
      if (!palettes[baseColorName]) {
        palettes[baseColorName] = [];
      }
      
      palettes[baseColorName].push(style);
    });
    
    return palettes;
  };
  
  // Group text styles by category
  const groupTextStyles = (): Record<string, TextStyleDB[]> => {
    const categories: Record<string, TextStyleDB[]> = {};
    
    textStyles.forEach(style => {
      // Filter by search
      if (localSearchQuery && !style.name.toLowerCase().includes(localSearchQuery.toLowerCase())) {
        return;
      }
      
      // Filter by free/pro if needed
      if (showFree && (style.folder?.toLowerCase().includes('pro') || style.name.toLowerCase().includes('pro'))) {
        return;
      }
      
      // Filter by selected style category
      if (filterSelection === 'Color styles') {
        return; // Skip text styles when color styles are selected
      }
      
      const category = style.folder || 'Typography';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(style);
    });
    
    return categories;
  };
  
  // Determine if a style is Pro or Free
  const isProStyle = (style: ColorStyleDB | TextStyleDB): boolean => {
    const name = style.name.toLowerCase();
    const folder = style.folder?.toLowerCase() || '';
    
    return folder.includes('pro') || name.includes('pro');
  };
  
  // Function to extract color swatches from a color style group
  const getColorSwatches = (styles: ColorStyleDB[]): string[] => {
    // Sort by shade number if possible
    const sortedStyles = [...styles].sort((a, b) => {
      const aMatch = a.name.match(/(\d+)$/);
      const bMatch = b.name.match(/(\d+)$/);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      return a.name.localeCompare(b.name);
    });
    
    // Return the colors, up to 6
    return sortedStyles.slice(0, 6).map(style => style.light_color);
  };
  
  // Add a color style to Framer project
  const addColorStyleToFramer = async (styles: ColorStyleDB[]) => {
    try {
      setSuccessMessage('Adding color style to Framer...');
      
      // Create a folder name based on the base color
      const baseColorName = getBaseColorName(styles[0].name);
      const folderName = `Cosmoe/${baseColorName}`;
      
      // Process all related styles in the palette
      for (const style of styles) {
        // Create a name that includes the specific shade if applicable
        const shadeName = style.name.replace(baseColorName, '').trim();
        const fullName = shadeName ? `${folderName}/${shadeName}` : folderName;
        
        // Create the color style in Framer
        await framer.createColorStyle({
          name: fullName,
          light: style.light_color,
          dark: style.dark_color || style.light_color, // Fall back to light color if dark is not available
        });
      }
      
      setSuccessMessage(`Added ${baseColorName} palette to Framer`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding color style to Framer:', err);
      setError('Failed to add color style to Framer');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Add a text style to Framer project
  const addTextStyleToFramer = async (styles: TextStyleDB[]) => {
    try {
      setSuccessMessage('Adding text style to Framer...');
      
      // Create a folder name based on the category
      const category = styles[0].folder || 'Typography';
      const folderName = `Cosmoe/${category}`;
      
      // Process all related text styles in the category
      for (const style of styles) {
        // Create the text style in Framer
        await framer.createTextStyle({
          name: `${folderName}/${style.name}`,
          fontSize: style.font_size,
          lineHeight: style.line_height || undefined,
          color: style.color || undefined,
          tag: style.tag || undefined,
        });
      }
      
      setSuccessMessage(`Added ${category} text styles to Framer`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding text style to Framer:', err);
      setError('Failed to add text style to Framer');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Filter options
  const styleFilterOptions = [
    'All styles',
    'Color styles',
    'Text styles'
  ];
  
  // Render filter dropdown
  const renderFilterDropdown = () => {
    return (
      <div className="tokens-filter-row">
        <div 
          className={`filter-select ${isSelectActive ? 'active' : ''}`}
          onClick={() => {
            setFilterOpen(!filterOpen);
            setIsSelectActive(!isSelectActive);
          }}
        >
          <div className="filter-content">
            <span className="filter-label">Filter by style:</span>
            <span className="filter-value">{filterSelection}</span>
          </div>
          <ChevronDown size={12} className={`filter-arrow ${filterOpen ? 'open' : ''}`} />
          
          {filterOpen && (
            <div className="filter-dropdown">
              {styleFilterOptions.map(option => (
                <button 
                  key={option}
                  className={`filter-option ${option === filterSelection ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterSelection(option);
                    setFilterOpen(false);
                    setIsSelectActive(false);
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
            onClick={() => {/* This would be handled by the parent */}}
          >
            <div className="toggle-handle"></div>
          </div>
        </div>
      </div>
    );
  };

  // Render success message
  const renderSuccessMessage = () => {
    if (!successMessage) return null;
    
    return (
      <div className="success-message">
        <p>{successMessage}</p>
      </div>
    );
  };

  // Render all styles in a grid
  const renderAllStyles = () => {
    const colorPalettes = groupStylesByPalette();
    const textCategories = groupTextStyles();
    
    // Filter by type if needed
    const showColors = filterSelection === 'All styles' || filterSelection === 'Color styles';
    const showText = filterSelection === 'All styles' || filterSelection === 'Text styles';
    
    if (Object.keys(colorPalettes).length === 0 && Object.keys(textCategories).length === 0) {
      return (
        <div className="empty-state">
          <p>No styles found for your filters</p>
        </div>
      );
    }
    
    return (
      <div className="components-grid">
        {/* Render color palettes */}
        {showColors && Object.entries(colorPalettes).map(([paletteName, styles]) => {
          const isPro = styles.some(isProStyle);
          const swatches = getColorSwatches(styles);
          const paletteId = `color-${paletteName.replace(/\s+/g, '-').toLowerCase()}`;
          
          return (
            <div key={paletteId} className="component-card">
              <div 
                className="component-preview"
                onClick={() => addColorStyleToFramer(styles)}
              >
                <div className="color-swatches">
                  {swatches.map((color, index) => (
                    <div 
                      key={index}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
                
                <button 
                  className={`favorite-btn ${favorites.has(paletteId) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(paletteId);
                  }}
                >
                  <Heart 
                    size={16} 
                    fill={favorites.has(paletteId) ? "#007AFF" : "none"} 
                    stroke={favorites.has(paletteId) ? "#007AFF" : "#007AFF"} 
                  />
                </button>
              </div>
              
              <div className="component-info">
                <h3>{paletteName}</h3>
                <div className={`badge ${isPro ? 'pro' : 'free'}`}>
                  {isPro ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#007AFF">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      <span>Pro</span>
                    </>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Render text styles */}
        {showText && Object.entries(textCategories).map(([category, styles]) => {
          const isPro = styles.some(isProStyle);
          const categoryId = `text-${category.replace(/\s+/g, '-').toLowerCase()}`;
          // Use the first style for preview
          const previewStyle = styles[0];
          
          return (
            <div key={categoryId} className="component-card">
              <div 
                className="component-preview"
                onClick={() => addTextStyleToFramer(styles)}
              >
                <div className="text-preview">
                  <span
                    style={{
                      fontFamily: previewStyle.font_family || 'inherit',
                      fontSize: '32px',
                      fontWeight: previewStyle.font_weight || 'normal',
                      lineHeight: previewStyle.line_height || '1.2'
                    }}
                  >
                    Aa
                  </span>
                </div>
                
                <button 
                  className={`favorite-btn ${favorites.has(categoryId) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(categoryId);
                  }}
                >
                  <Heart 
                    size={16} 
                    fill={favorites.has(categoryId) ? "#007AFF" : "none"} 
                    stroke={favorites.has(categoryId) ? "#007AFF" : "#007AFF"} 
                  />
                </button>
              </div>
              
              <div className="component-info">
                <h3>{category}</h3>
                <div className={`badge ${isPro ? 'pro' : 'free'}`}>
                  {isPro ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#007AFF">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      <span>Pro</span>
                    </>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Loading skeleton UI
  const renderLoadingSkeleton = () => {
    return (
      <div className="components-grid loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="component-card skeleton">
            <div className="component-preview skeleton-preview"></div>
            <div className="component-info">
              <div className="skeleton-title"></div>
              <div className="skeleton-badge"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="tokens-view">
      {/* Filter UI */}
      {renderFilterDropdown()}
      
      {/* Success message */}
      {renderSuccessMessage()}
      
      {/* Content */}
      {loadingStyles ? renderLoadingSkeleton() : renderAllStyles()}
      
      {/* Error state */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}