import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';

interface System {
  id: string;
  name: string;
}

interface Connection {
  source: string;
  target: string;
  direction: 'one-way' | 'bidirectional';
  quality: 'automated' | 'semi-automated' | 'manual';
  volume?: number;
}

interface MarkovPlotProps {
  systems: System[];
  connections: Connection[];
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showExportLabels?: boolean;
}

export default function MarkovPlot({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
  title = 'Markov Transition Diagram',
  subtitle = '',
  showExportLabels = false
}: MarkovPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || systems.length === 0 || connections.length === 0) return;

    // Clear previous plot
    containerRef.current.innerHTML = '';

    // Create nodes from systems
    const nodes = systems.map(system => ({
      id: system.id,
      name: system.name,
      // Add random position to improve layout
      x: Math.random() * width,
      y: Math.random() * height
    }));

    // Create links from connections
    const links = connections.map(connection => {
      const sourceSystem = systems.find(s => s.id === connection.source);
      const targetSystem = systems.find(s => s.id === connection.target);
      
      if (!sourceSystem || !targetSystem) return null;
      
      return {
        source: sourceSystem.name,
        target: targetSystem.name,
        value: connection.volume || 10, // Use volume if available, or default value
        direction: connection.direction
      };
    }).filter(Boolean);

    // Calculate transition probabilities
    const transitionMatrix: Record<string, Record<string, number>> = {};
    
    // Initialize matrix with zeros
    systems.forEach(source => {
      transitionMatrix[source.name] = {};
      systems.forEach(target => {
        transitionMatrix[source.name][target.name] = 0;
      });
    });
    
    // Fill in probabilities based on connections
    connections.forEach(connection => {
      const sourceSystem = systems.find(s => s.id === connection.source);
      const targetSystem = systems.find(s => s.id === connection.target);
      
      if (!sourceSystem || !targetSystem) return;
      
      // Default weight
      const weight = connection.volume || 10;
      
      transitionMatrix[sourceSystem.name][targetSystem.name] += weight;
    });
    
    // Normalize to get probabilities
    systems.forEach(source => {
      const total = Object.values(transitionMatrix[source.name]).reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        systems.forEach(target => {
          transitionMatrix[source.name][target.name] /= total;
        });
      }
    });
    
    // Convert matrix to array of transitions with probabilities
    const transitions: Array<{source: string, target: string, probability: number}> = [];
    
    systems.forEach(source => {
      systems.forEach(target => {
        const prob = transitionMatrix[source.name][target.name];
        if (prob > 0) {
          transitions.push({
            source: source.name,
            target: target.name,
            probability: prob
          });
        }
      });
    });
    
    // Create a heatmap representation
    const heatmapData = systems.flatMap(source => 
      systems.map(target => ({
        source: source.name,
        target: target.name,
        value: transitionMatrix[source.name][target.name]
      }))
    );

    try {
      // Create the Markov transition heatmap
      const plot = Plot.plot({
        width,
        height,
        marginLeft: 100,
        marginRight: 40,
        marginTop: 40,
        marginBottom: 100,
        x: {
          label: "Target System →",
          tickRotate: -45
        },
        y: {
          label: "← Source System"
        },
        color: {
          label: "Transition Probability",
          scheme: "BuPu",
          legend: true
        },
        marks: [
          Plot.cell(heatmapData, {
            x: "target",
            y: "source",
            fill: "value",
            inset: 0.5,
            title: (d) => `${d.source} → ${d.target}: ${(d.value * 100).toFixed(1)}%`
          }),
          Plot.text(heatmapData.filter(d => d.value > 0), {
            x: "target",
            y: "source",
            text: (d) => d.value > 0.05 ? `${(d.value * 100).toFixed(0)}%` : "",
            fill: (d) => d.value > 0.5 ? "white" : "black"
          }),
          ...(showExportLabels ? [
            Plot.text([{x: width / 2, y: -5}], {
              x: "x",
              y: "y",
              text: () => title,
              fontSize: 16,
              fontWeight: "bold",
              dy: -10
            }),
            Plot.text([{x: width / 2, y: -5}], {
              x: "x",
              y: "y",
              text: () => subtitle || `${systems.length} Systems with ${connections.length} Connections`,
              fontSize: 12,
              dy: 10
            }),
            Plot.text([{x: width / 2, y: height + 30}], {
              x: "x",
              y: "y",
              text: () => `Generated on ${new Date().toLocaleDateString()}`,
              fontSize: 10,
              dy: 10
            })
          ] : [])
        ]
      });

      // Render the plot
      containerRef.current.appendChild(plot);
    } catch (error: any) {
      console.error("Error creating Markov plot:", error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500">Error creating visualization: ${error.message || 'Unknown error'}</div>`;
      }
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [systems, connections, width, height, title, subtitle, showExportLabels]);

  return (
    <div className={`markov-plot ${className}`}>
      <div ref={containerRef} className="w-full h-full overflow-auto" />
    </div>
  );
}