import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import ObservablePlot from '../components/observable-plot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ObservableDemoPage() {
  const [barData, setBarData] = useState([
    { label: 'EMR', value: 78, color: '#4CAF50' },
    { label: 'PAS', value: 65, color: '#2196F3' },
    { label: 'LIS', value: 42, color: '#9C27B0' },
    { label: 'RIS', value: 34, color: '#FF9800' },
    { label: 'PACS', value: 56, color: '#607D8B' }
  ]);

  const [newDataPoint, setNewDataPoint] = useState({
    label: '',
    value: 0,
    color: '#ff0000'
  });

  const addDataPoint = () => {
    if (newDataPoint.label.trim() === '') return;
    
    setBarData([...barData, { 
      label: newDataPoint.label, 
      value: Number(newDataPoint.value),
      color: newDataPoint.color
    }]);
    
    // Reset form
    setNewDataPoint({
      label: '',
      value: 0,
      color: '#ff0000'
    });
  };

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Link href="/resources">
              <Button variant="outline" className="mr-4">
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Observable Plot Demo</h2>
              <p className="mt-2 text-lg text-gray-600">
                Explore interactive data visualizations using Observable Plot
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="col-span-1 lg:col-span-2">
              <ObservablePlot
                title="Healthcare Systems Integration Score"
                description="Level of integration maturity per system (0-100 scale)"
                data={barData}
                width={700}
                height={400}
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Data Point</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="label">System Name</Label>
                  <Input 
                    id="label" 
                    value={newDataPoint.label}
                    onChange={(e) => setNewDataPoint({...newDataPoint, label: e.target.value})}
                    placeholder="e.g., EDI"
                  />
                </div>
                
                <div>
                  <Label htmlFor="value">Integration Score (0-100)</Label>
                  <Input 
                    id="value" 
                    type="number" 
                    min="0" 
                    max="100"
                    value={newDataPoint.value}
                    onChange={(e) => setNewDataPoint({...newDataPoint, value: parseInt(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="color"
                      id="color"
                      value={newDataPoint.color}
                      onChange={(e) => setNewDataPoint({...newDataPoint, color: e.target.value})}
                      className="w-10 h-10 rounded border border-gray-300"
                    />
                    <span className="text-sm text-gray-500">{newDataPoint.color}</span>
                  </div>
                </div>
                
                <Button onClick={addDataPoint} className="w-full">
                  Add System
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">About Observable Plot</h3>
            <p className="text-gray-600 mb-4">
              Observable Plot is a JavaScript library for exploratory data visualization. 
              It's designed for data analysts who want to focus more on the data and less 
              on the mechanics of visualization.
            </p>
            <p className="text-gray-600 mb-4">
              Key benefits of Observable Plot:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Concise API with intelligent defaults</li>
              <li>Built on SVG for high-quality graphics</li>
              <li>Support for a wide variety of plot types</li>
              <li>Automatic scales and axes</li>
              <li>Powerful support for faceting and layering</li>
            </ul>
            <p className="text-gray-600">
              This demo shows how Plot can be integrated into a React application to create 
              interactive visualizations for healthcare integration data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}