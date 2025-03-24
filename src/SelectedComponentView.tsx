import React from "react";
import { ChevronLeft, RefreshCw } from "lucide-react";

interface SelectedComponentViewProps {
  component: {
    title: string;
    isPro: boolean;
    url: string;
    isDetached?: boolean;
  };
  onBack: () => void;
  onReplace: () => void;
}

export function SelectedComponentView({ component, onBack, onReplace }: SelectedComponentViewProps) {
  return (
    <div className="component-view-container">
      <div className="view-header">
        <button className="back-button" onClick={onBack}>
          <ChevronLeft size={16} /> Back Home
        </button>
      </div>
      
      <h2 className="view-title">Selected component</h2>
      
      {component.isDetached && (
        <div className="info-note">
          <span>Note: Replacement is not available for detached layers</span>
        </div>
      )}
      
      <div className="component-preview-large">
        <div className="placeholder-image">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div className="component-title">{component.title}</div>
      
      <button 
        className="replace-button"
        onClick={onReplace}
        disabled={component.isDetached}
      >
        <RefreshCw size={16} />
        Replace component
      </button>
    </div>
  );
}