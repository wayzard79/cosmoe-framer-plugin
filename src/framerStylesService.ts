// framerStylesService.ts
import { framer } from 'framer-plugin';
import { supabase } from './supabaseClient';

// Types for our styles database
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

// Utility functions
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