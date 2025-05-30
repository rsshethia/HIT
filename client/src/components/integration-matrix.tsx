import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

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

interface IntegrationMatrixProps {
  systems: System[];
  connections: Connection[];
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showExportLabels?: boolean;
}

const IntegrationMatrix: React.FC<IntegrationMatrixProps> = ({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
  title = 'Integration Matrix',
  subtitle = 'System Connection Map',
  showExportLabels = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !systems.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Increase margins for better spacing and readability
    const margin = { 
      top: showExportLabels ? 160 : 140, 
      right: 40, 
      bottom: showExportLabels ? 80 : 60, 
      left: 160 
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
      
    // Add title and subtitle for exports
    if (showExportLabels) {
      // Add title
      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -80)
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(title);
        
      // Add subtitle
      svg.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', -50)
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
        .attr('x', innerWidth / 2)
        .attr('y', -25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#6B7280')
        .text(`Generated on: ${currentDate}`);
        
      // Add guiding text
      svg.append('text')
        .attr('x', -10)
        .attr('y', -80)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .text('Source Systems →');
        
      svg.append('text')
        .attr('y', -10)
        .attr('x', -80)
        .attr('text-anchor', 'start')
        .attr('transform', 'rotate(-90)')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#374151')
        .text('↑ Target Systems');
    }

    // Create scales for row and column positions
    const x = d3.scaleBand().range([0, innerWidth]).paddingInner(0.1);
    const y = d3.scaleBand().range([0, innerHeight]).paddingInner(0.1);

    // Set domains
    x.domain(systems.map(system => system.id));
    y.domain(systems.map(system => system.id));

    // Create a map for quick connection lookups
    const connectionMap = new Map();
    connections.forEach(conn => {
      const key = `${conn.source}-${conn.target}`;
      connectionMap.set(key, conn);
    });

    // Function to get connection info
    const getConnection = (source: string, target: string) => {
      const key = `${source}-${target}`;
      return connectionMap.get(key);
    };

    // Function to get color based on connection quality
    const getColor = (quality: string | undefined) => {
      if (!quality) return '#f3f4f6'; // Light gray for no connection
      switch (quality) {
        case 'automated':
          return '#10b981'; // Green
        case 'semi-automated':
          return '#f59e0b'; // Amber
        case 'manual':
          return '#ef4444'; // Red
        default:
          return '#f3f4f6';
      }
    };

    // Function to get icon based on connection direction
    const getDirectionIcon = (source: string, target: string) => {
      const conn = getConnection(source, target);
      if (!conn) return '';
      
      return conn.direction === 'bidirectional' ? '↔' : '→';
    };

    // Create rows
    const rows = svg
      .selectAll('.row')
      .data(systems)
      .enter()
      .append('g')
      .attr('class', 'row')
      .attr('transform', d => `translate(0, ${y(d.id) || 0})`);

    // Add row labels (Y-axis)
    rows
      .append('text')
      .attr('x', -15)
      .attr('y', y.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e3a8a')  // Darker blue for better readability
      .text(d => d.name)
      // Add a white background to row labels for better readability
      .each(function() {
        const bbox = this.getBBox();
        const padding = 3;
        const parent = this.parentNode;
        if (parent) {
          d3.select(parent as Element)
            .insert('rect', 'text')
            .attr('x', bbox.x - padding)
            .attr('y', bbox.y - padding)
            .attr('width', bbox.width + (padding * 2))
            .attr('height', bbox.height + (padding * 2))
            .attr('fill', 'white')
            .attr('fill-opacity', 0.9)
            .attr('rx', 2);
        }
      });

    // Create columns
    const columns = svg
      .selectAll('.column')
      .data(systems)
      .enter()
      .append('g')
      .attr('class', 'column')
      .attr('transform', d => `translate(${x(d.id) || 0}, 0)`);

    // Add column labels (X-axis)
    columns
      .append('text')
      .attr('y', -15)
      .attr('x', x.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('transform', d => `rotate(-45, ${x.bandwidth() / 2}, -15)`)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#1e3a8a')  // Darker blue for better readability
      .text(d => d.name)
      // Add a white background to column labels for better readability
      .each(function() {
        const bbox = this.getBBox();
        const padding = 3;
        const parent = this.parentNode;
        if (parent) {
          d3.select(parent as Element)
            .insert('rect', 'text')
            .attr('x', bbox.x - padding)
            .attr('y', bbox.y - padding)
            .attr('width', bbox.width + (padding * 2))
            .attr('height', bbox.height + (padding * 2))
            .attr('fill', 'white')
            .attr('fill-opacity', 0.9)
            .attr('rx', 2);
        }
      });

    // Create grid cells for each source-target pair
    systems.forEach(source => {
      systems.forEach(target => {
        if (source.id === target.id) {
          // Diagonal elements (same system)
          svg
            .append('rect')
            .attr('x', x(source.id) || 0)
            .attr('y', y(target.id) || 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', '#e5e7eb') // Gray for diagonal
            .attr('stroke', '#d1d5db');
        } else {
          // Off-diagonal elements (different systems)
          const connection = getConnection(source.id, target.id);
          
          // Create the cell
          const cell = svg
            .append('rect')
            .attr('x', x(source.id) || 0)
            .attr('y', y(target.id) || 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', getColor(connection?.quality))
            .attr('stroke', '#d1d5db');
          
          // Add tooltip
          cell.append('title')
            .text(() => {
              if (!connection) return 'No connection';
              return `From: ${source.name}\nTo: ${target.name}\nType: ${connection.direction}\nQuality: ${connection.quality}`;
            });
          
          // Add direction indicator
          if (connection) {
            svg
              .append('text')
              .attr('x', (x(source.id) || 0) + x.bandwidth() / 2)
              .attr('y', (y(target.id) || 0) + y.bandwidth() / 2)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', '18px')
              .attr('fill', 'white')
              .text(getDirectionIcon(source.id, target.id));
          }
        }
      });
    });

    // Add a combined legend with background
    const legendBg = svg
      .append('g')
      .attr('class', 'legend-container');
      
    // Add background rectangle for the entire legend area
    legendBg.append('rect')
      .attr('x', -5)
      .attr('y', innerHeight + 10)
      .attr('width', innerWidth + 10)
      .attr('height', 60)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 5);
    
    // Add "Legend:" label
    legendBg.append('text')
      .attr('x', 5)
      .attr('y', innerHeight + 25)
      .text('Legend:')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1f2937');

    // Add connection quality legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(60, ${innerHeight + 25})`);

    const qualities = [
      { quality: 'automated', label: 'Automated', color: '#10b981' },
      { quality: 'semi-automated', label: 'Semi-automated', color: '#f59e0b' },
      { quality: 'manual', label: 'Manual', color: '#ef4444' },
      { quality: 'none', label: 'No Connection', color: '#f3f4f6' },
    ];

    legend
      .selectAll('.legend-item')
      .data(qualities)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 130}, 0)`) // Increased spacing
      .each(function(d) {
        const g = d3.select(this);
        // Larger colored square
        g.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 16)
          .attr('height', 16)
          .attr('fill', d.color)
          .attr('stroke', '#d1d5db')
          .attr('rx', 2); // Rounded corners

        // Improved label styling
        g.append('text')
          .attr('x', 26)
          .attr('y', 13)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('font-weight', 'medium')
          .attr('fill', '#374151');
      });

    // Add direction legend
    const directionLegend = svg
      .append('g')
      .attr('class', 'direction-legend')
      .attr('transform', `translate(60, ${innerHeight + 50})`);

    const directions = [
      { symbol: '→', label: 'One-way' },
      { symbol: '↔', label: 'Bidirectional' },
    ];

    directionLegend
      .selectAll('.direction-item')
      .data(directions)
      .enter()
      .append('g')
      .attr('class', 'direction-item')
      .attr('transform', (d, i) => `translate(${i * 130}, 0)`) // Match spacing with quality legend
      .each(function(d) {
        const g = d3.select(this);
        
        // Circle background for symbol
        g.append('circle')
          .attr('cx', 8)
          .attr('cy', 0)
          .attr('r', 8)
          .attr('fill', '#e5e7eb');
          
        // Direction symbol
        g.append('text')
          .attr('x', 8)
          .attr('y', 5)
          .attr('text-anchor', 'middle')
          .text(d.symbol)
          .attr('font-size', '16px')
          .attr('fill', '#374151');

        // Label
        g.append('text')
          .attr('x', 26)
          .attr('y', 5)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('font-weight', 'medium')
          .attr('fill', '#374151');
      });

  }, [systems, connections, width, height, title, subtitle, showExportLabels]);

  return (
    <div className={`integration-matrix-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default IntegrationMatrix;