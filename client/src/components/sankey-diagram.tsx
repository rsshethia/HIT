import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
// Use only d3 without specific d3-sankey import
// This helps avoid runtime errors related to d3-sankey module

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

interface SankeyDiagramProps {
  systems: System[];
  connections: Connection[];
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showExportLabels?: boolean;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
  title = 'Data Flow Diagram',
  subtitle = 'System Integration Flow',
  showExportLabels = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !systems.length || !connections.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Adjust margins to accommodate title when showing export labels
    const margin = { 
      top: showExportLabels ? 70 : 10, 
      right: 10, 
      bottom: 10, 
      left: 10 
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
      
    // Add title and subtitle for exports
    if (showExportLabels) {
      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(title);
        
      // Add subtitle
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 55)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('fill', '#4B5563')
        .text(subtitle);
        
      // Add date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      svg.append('text')
        .attr('x', width - 20)
        .attr('y', height - 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#6B7280')
        .text(`Generated on: ${currentDate}`);
    }
    
    // Main visualization group
    const mainG = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create system map for quick lookups
    const systemMap = new Map();
    systems.forEach(system => {
      systemMap.set(system.id, system);
    });

    // Process data for D3 Sankey format
    const nodeMap = new Map();
    systems.forEach(system => {
      nodeMap.set(system.id, { name: system.name });
    });

    // Create nodes array for Sankey
    const nodes = Array.from(nodeMap.values());

    // Create links array for Sankey 
    const links = connections.map(conn => {
      const source = systemMap.get(conn.source)?.name || 'Unknown';
      const target = systemMap.get(conn.target)?.name || 'Unknown';
      
      return {
        source,
        target,
        value: conn.volume || 10, // Default to 10 if volume not provided
        quality: conn.quality
      };
    });

    // Since we have issues with d3-sankey, let's implement a simple flow diagram
    // Set up colors based on integration quality
    const qualityColors = {
      'automated': '#10b981',     // Green
      'semi-automated': '#f59e0b', // Amber
      'manual': '#ef4444'         // Red
    };

    // Calculate total message volume for scaling
    const totalVolume = links.reduce((sum, link) => sum + (link.value), 0);
    const maxVolumePerLink = Math.max(...links.map(link => link.value));
    
    // Set up dynamic positioning
    const nodeWidth = 150;
    const nodeHeight = 30;
    const nodePadding = 15;
    
    // Calculate positions for nodes (simple left-to-right layout)
    // Group by source/target to determine columns
    const nodePositions = new Map();
    const sources = new Set(links.map(link => link.source));
    const targets = new Set(links.map(link => link.target));
    
    // Put pure sources on left, pure targets on right, and mixed in middle
    const leftNodes: string[] = [];
    const middleNodes: string[] = [];
    const rightNodes: string[] = [];
    
    nodes.forEach((node: any) => {
      const nodeName = node.name;
      if (sources.has(nodeName) && !targets.has(nodeName)) {
        leftNodes.push(nodeName);
      } else if (!sources.has(nodeName) && targets.has(nodeName)) {
        rightNodes.push(nodeName);
      } else {
        middleNodes.push(nodeName);
      }
    });
    
    // Set positions for each node
    const leftX = 20;
    const middleX = innerWidth / 2 - nodeWidth / 2;
    const rightX = innerWidth - nodeWidth - 20;
    
    leftNodes.forEach((nodeName, index) => {
      nodePositions.set(nodeName, {
        x: leftX,
        y: 50 + index * (nodeHeight + nodePadding),
        width: nodeWidth,
        height: nodeHeight
      });
    });
    
    middleNodes.forEach((nodeName, index) => {
      nodePositions.set(nodeName, {
        x: middleX,
        y: 100 + index * (nodeHeight + nodePadding),
        width: nodeWidth,
        height: nodeHeight
      });
    });
    
    rightNodes.forEach((nodeName, index) => {
      nodePositions.set(nodeName, {
        x: rightX,
        y: 50 + index * (nodeHeight + nodePadding),
        width: nodeWidth,
        height: nodeHeight
      });
    });

    // Draw connections
    links.forEach(link => {
      const sourcePos = nodePositions.get(link.source);
      const targetPos = nodePositions.get(link.target);
      
      if (!sourcePos || !targetPos) return;
      
      // Calculate link width based on volume
      const linkWidth = 2 + (link.value / maxVolumePerLink) * 8;
      
      // Draw a simple curved path between source and target
      const sourceX = sourcePos.x + sourcePos.width;
      const sourceY = sourcePos.y + sourcePos.height / 2;
      const targetX = targetPos.x;
      const targetY = targetPos.y + targetPos.height / 2;
      const controlPointX = (sourceX + targetX) / 2;
      
      mainG.append('path')
         .attr('d', `M${sourceX},${sourceY} C${controlPointX},${sourceY} ${controlPointX},${targetY} ${targetX},${targetY}`)
         .attr('stroke', qualityColors[link.quality as keyof typeof qualityColors] || '#9ca3af')
         .attr('stroke-width', linkWidth)
         .attr('fill', 'none')
         .attr('opacity', 0.7)
         .append('title')
         .text(`${link.source} → ${link.target}\nVolume: ${link.value} msg/hr\nQuality: ${link.quality}`);
    });

    // Draw nodes
    nodes.forEach((node: any) => {
      const pos = nodePositions.get(node.name);
      if (!pos) return;
      
      // Node rectangle
      mainG.append('rect')
         .attr('x', pos.x)
         .attr('y', pos.y)
         .attr('width', pos.width)
         .attr('height', pos.height)
         .attr('rx', 5)
         .attr('ry', 5)
         .attr('fill', '#3b82f6')
         .attr('stroke', '#1e40af');
      
      // Node label
      mainG.append('text')
         .attr('x', pos.x + pos.width / 2)
         .attr('y', pos.y + pos.height / 2)
         .attr('dy', '0.35em')
         .attr('text-anchor', 'middle')
         .attr('font-size', '10px')
         .attr('fill', 'white')
         .attr('font-weight', 'bold')
         .attr('pointer-events', 'none')
         .text(node.name);
    });

    // Add a legend
    const legend = mainG
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, ${innerHeight - 60})`);

    const qualities = [
      { quality: 'automated', label: 'Automated', color: '#10b981' },
      { quality: 'semi-automated', label: 'Semi-automated', color: '#f59e0b' },
      { quality: 'manual', label: 'Manual', color: '#ef4444' },
    ];

    legend
      .selectAll('.legend-item')
      .data(qualities)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', 30)
          .attr('y2', 0)
          .attr('stroke', d.color)
          .attr('stroke-width', 5);

        g.append('text')
          .attr('x', 40)
          .attr('y', 4)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('fill', '#374151');
      });

  }, [systems, connections, width, height, title, subtitle, showExportLabels]);

  return (
    <div className={`sankey-diagram-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default SankeyDiagram;