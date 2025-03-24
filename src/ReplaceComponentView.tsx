import React, { useState } from "react";
import { ChevronLeft, Search, Heart, Crown } from "lucide-react";

interface ComponentCard {
  id: string;
  title: string;
  isPro: boolean;
  isFavorite: boolean;
  url: string;
  type: string;
  category: string;
}

interface ReplaceComponentViewProps {
  components: ComponentCard[];
  onBack: () => void;
  onSelect: (component: ComponentCard) => void;
  onToggleFavorite: (id: string) => void;
}

export function ReplaceComponentView({ 
  components, 
  onBack, 
  onSelect,
  onToggleFavorite 
}: ReplaceComponentViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredComponents = components.filter(component => 
    component.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="component-view-container">
      <div className="view-header">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={16} /> Replace component
        </button>
      </div>
      
      <div className="search-container replace-search">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input 
            type="search"
            placeholder="Search components"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <h3 className="components-section-title">Suggested components</h3>
      
      <div className="replacement-grid">
        {filteredComponents.map(component => (
          <div 
            key={component.id} 
            className="replacement-card"
            onClick={() => onSelect(component)}
          >
            <div className="replacement-preview">
              <button 
                className={`favorite-btn ${component.isFavorite ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(component.id);
                }}
              >
                <Heart 
                  size={16} 
                  fill={component.isFavorite ? "#007AFF" : "none"} 
                  stroke={component.isFavorite ? "#007AFF" : "#007AFF"} 
                />
              </button>
            </div>
            <div className="replacement-info">
              <h4>{component.title}</h4>
              {component.isPro && (
                <div className="badge pro">
                  <Crown size={12} fill="#007AFF" />
                  <span>Pro</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}