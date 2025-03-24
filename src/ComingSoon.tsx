import React from 'react';
import { FileCode } from 'lucide-react';

export function ComingSoon() {
  return (
    <div className="templates-coming-soon">
      {/* Custom file code icon - matches plugin design better */}
      <div className="template-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.3333 6.66667C18.6667 6.66667 15 10.3333 15 15V65C15 69.6667 18.6667 73.3333 23.3333 73.3333H56.6667C61.3333 73.3333 65 69.6667 65 65V25L46.6667 6.66667H23.3333Z" 
            stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M46.6667 6.66667V25H65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M33.3333 43.3333L26.6667 50L33.3333 56.6667" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M46.6667 43.3333L53.3333 50L46.6667 56.6667" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <h2 className="templates-title">Templates Coming Soon</h2>
      
      <p className="templates-description">
        We're working on adding ready-to-use templates to help you build amazing websites faster. Check back soon!
      </p>
    </div>
  );
}