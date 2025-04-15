import React from 'react';

export function DevHeader() {
  return (
    <div className="bg-amber-100 border-b border-amber-200 py-1 text-center text-sm text-amber-800">
      <div className="container mx-auto px-4 flex items-center justify-center">
        <span className="material-icons text-amber-600 mr-1 text-sm">construction</span>
        <span>Development Version - Supported by Rushabh Shethia</span>
      </div>
    </div>
  );
}