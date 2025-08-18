import React from 'react';

export function DevHeader() {
  // Version information
  const version = "0.6.5";
  const lastUpdated = "August 18, 2025";
  
  return (
    <div className="bg-amber-100 border-b border-amber-200 py-1 text-center text-sm text-amber-800">
      <div className="container mx-auto px-4 flex items-center justify-center flex-wrap">
        <span className="material-icons text-amber-600 mr-1 text-sm">construction</span>
        <span>
          Dev Version {version} (Updated: {lastUpdated}) - Supported by{" "}
          <a 
            href="https://www.linkedin.com/in/rsshethia" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            Rushabh Shethia
          </a>
        </span>
      </div>
    </div>
  );
}