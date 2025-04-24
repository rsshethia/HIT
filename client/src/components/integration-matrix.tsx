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
}

const IntegrationMatrix: React.FC<IntegrationMatrixProps> = ({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !systems.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 120, right: 20, bottom: 20, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

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
      .attr('x', -10)
      .attr('y', y.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(d => d.name);

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
      .attr('y', -10)
      .attr('x', x.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'start')
      .attr('transform', d => `rotate(-45, ${x.bandwidth() / 2}, -10)`)
      .attr('font-size', '12px')
      .text(d => d.name);

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

    // Add a legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(0, ${innerHeight + 20})`);

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
      .attr('transform', (d, i) => `translate(${i * 120}, 0)`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 15)
          .attr('height', 15)
          .attr('fill', d.color)
          .attr('stroke', '#d1d5db');

        g.append('text')
          .attr('x', 25)
          .attr('y', 12)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('fill', '#374151');
      });

    // Add direction legend
    const directionLegend = svg
      .append('g')
      .attr('class', 'direction-legend')
      .attr('transform', `translate(${innerWidth - 200}, ${innerHeight + 20})`);

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
      .attr('transform', (d, i) => `translate(${i * 100}, 0)`)
      .each(function(d) {
        const g = d3.select(this);
        g.append('text')
          .attr('x', 0)
          .attr('y', 12)
          .text(d.symbol)
          .attr('font-size', '18px')
          .attr('fill', '#374151');

        g.append('text')
          .attr('x', 25)
          .attr('y', 12)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('fill', '#374151');
      });

  }, [systems, connections, width, height]);

  return (
    <div className={`integration-matrix-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default IntegrationMatrix;