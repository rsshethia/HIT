import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

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
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !systems.length || !connections.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
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

    // Create a Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    // Run the Sankey algorithm to compute positions
    const sankeyData = sankeyGenerator({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: links.map(d => Object.assign({}, d))
    });

    // Set up colors based on integration quality
    const qualityColors = {
      'automated': '#10b981',     // Green
      'semi-automated': '#f59e0b', // Amber
      'manual': '#ef4444'         // Red
    };

    // Add links
    svg
      .append('g')
      .selectAll('path')
      .data(sankeyData.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => qualityColors[d.quality as keyof typeof qualityColors] || '#9ca3af')
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.7)
      .append('title')
      .text((d: any) => `${d.source.name} → ${d.target.name}\nVolume: ${d.value} msg/hr\nQuality: ${d.quality}`);

    // Add nodes
    const node = svg
      .append('g')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .enter()
      .append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1e40af')
      .append('title')
      .text((d: any) => `${d.name}\nMessages: ${d.value}`);

    // Add node labels
    svg
      .append('g')
      .selectAll('text')
      .data(sankeyData.nodes)
      .enter()
      .append('text')
      .attr('x', (d: any) => d.x0 < innerWidth / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < innerWidth / 2 ? 'start' : 'end')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => d.name);

    // Add a legend
    const legend = svg
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

  }, [systems, connections, width, height]);

  return (
    <div className={`sankey-diagram-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default SankeyDiagram;