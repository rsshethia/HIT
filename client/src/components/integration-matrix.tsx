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
      top: showExportLabels ? 180 : 160, 
      right: 80, 
      bottom: showExportLabels ? 120 : 100, 
      left: 200 
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
    const x = d3.scaleBand().range([0, innerWidth]).paddingInner(0.05);
    const y = d3.scaleBand().range([0, innerHeight]).paddingInner(0.05);

    // Set domains
    x.domain(systems.map(system => system.id));
    y.domain(systems.map(system => system.id));

    // Add grid lines for better visual separation
    svg.selectAll('.grid-line-x')
      .data(systems)
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', d => (x(d.id) || 0) + x.bandwidth())
      .attr('x2', d => (x(d.id) || 0) + x.bandwidth())
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 0.5);

    svg.selectAll('.grid-line-y')
      .data(systems)
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => (y(d.id) || 0) + y.bandwidth())
      .attr('y2', d => (y(d.id) || 0) + y.bandwidth())
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 0.5);

    // Add main border
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2);

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
          // Diagonal elements (same system) - enhanced with system info
          const cellX = x(source.id) || 0;
          const cellY = y(target.id) || 0;
          
          svg
            .append('rect')
            .attr('x', cellX)
            .attr('y', cellY)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', '#f8fafc') // Light blue-gray for diagonal
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('rx', 3);
            
          // Add system indicator icon
          svg
            .append('circle')
            .attr('cx', cellX + x.bandwidth() / 2)
            .attr('cy', cellY + x.bandwidth() / 2)
            .attr('r', Math.min(x.bandwidth(), y.bandwidth()) / 4)
            .attr('fill', '#3b82f6')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
            
          // Add system initial or icon
          svg
            .append('text')
            .attr('x', cellX + x.bandwidth() / 2)
            .attr('y', cellY + y.bandwidth() / 2 + 1)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(source.name.charAt(0).toUpperCase());
        } else {
          // Off-diagonal elements (different systems)
          const connection = getConnection(source.id, target.id);
          
          // Create the cell with enhanced styling
          const cell = svg
            .append('rect')
            .attr('x', x(source.id) || 0)
            .attr('y', y(target.id) || 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('fill', getColor(connection?.quality))
            .attr('stroke', '#9ca3af')
            .attr('stroke-width', 1)
            .attr('rx', 2) // Rounded corners
            .style('cursor', 'pointer')
            .on('mouseover', function() {
              d3.select(this)
                .attr('stroke', '#374151')
                .attr('stroke-width', 2);
            })
            .on('mouseout', function() {
              d3.select(this)
                .attr('stroke', '#9ca3af')
                .attr('stroke-width', 1);
            });
          
          // Add enhanced tooltip with more information
          cell.append('title')
            .text(() => {
              if (!connection) {
                return `No connection between:\n${source.name} → ${target.name}\n\nConsider adding integration if needed.`;
              }
              const volumeText = connection.volume ? `\nVolume: ${connection.volume} msgs/day` : '';
              return `Integration Details:\n\nFrom: ${source.name}\nTo: ${target.name}\nDirection: ${connection.direction === 'bidirectional' ? 'Two-way' : 'One-way'}\nQuality: ${connection.quality.charAt(0).toUpperCase() + connection.quality.slice(1)}${volumeText}\n\nClick for more details`;
            });
          
          // Add direction indicator with enhanced styling
          if (connection) {
            const centerX = (x(source.id) || 0) + x.bandwidth() / 2;
            const centerY = (y(target.id) || 0) + y.bandwidth() / 2;
            
            // Add background circle for better visibility
            svg
              .append('circle')
              .attr('cx', centerX)
              .attr('cy', centerY)
              .attr('r', 12)
              .attr('fill', 'rgba(255, 255, 255, 0.9)')
              .attr('stroke', '#374151')
              .attr('stroke-width', 1);
            
            // Add direction arrow
            svg
              .append('text')
              .attr('x', centerX)
              .attr('y', centerY + 1)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .attr('font-size', '16px')
              .attr('font-weight', 'bold')
              .attr('fill', '#1f2937')
              .text(getDirectionIcon(source.id, target.id));
              
            // Add quality indicator (small dot in corner)
            const qualityColor = getColor(connection.quality);
            svg
              .append('circle')
              .attr('cx', (x(source.id) || 0) + x.bandwidth() - 8)
              .attr('cy', (y(target.id) || 0) + 8)
              .attr('r', 4)
              .attr('fill', qualityColor)
              .attr('stroke', 'white')
              .attr('stroke-width', 2);
          }
        }
      });
    });

    // Calculate statistics for the summary panel
    const totalConnections = connections.length;
    const automatedCount = connections.filter(c => c.quality === 'automated').length;
    const semiAutomatedCount = connections.filter(c => c.quality === 'semi-automated').length;
    const manualCount = connections.filter(c => c.quality === 'manual').length;
    const bidirectionalCount = connections.filter(c => c.direction === 'bidirectional').length;
    const oneWayCount = connections.filter(c => c.direction === 'one-way').length;

    // Add enhanced legend with improved visual design and statistics
    const legendContainer = svg
      .append('g')
      .attr('class', 'legend-container')
      .attr('transform', `translate(0, ${innerHeight + 20})`);
      
    // Add background rectangle for the entire legend area
    legendContainer.append('rect')
      .attr('x', -10)
      .attr('y', -10)
      .attr('width', innerWidth + 20)
      .attr('height', 80)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 5);

    // Add summary statistics in the upper right corner
    const statsContainer = legendContainer
      .append('g')
      .attr('class', 'stats-container')
      .attr('transform', `translate(${innerWidth - 200}, 5)`);

    statsContainer.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .text('Matrix Summary:')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .attr('fill', '#1f2937');

    const statsData = [
      `${systems.length} Systems`,
      `${totalConnections} Connections`,
      `${Math.round((automatedCount / totalConnections) * 100)}% Automated`
    ];

    statsContainer.selectAll('.stat-item')
      .data(statsData)
      .enter()
      .append('text')
      .attr('x', 0)
      .attr('y', (d, i) => 15 + (i * 12))
      .text(d => d)
      .attr('font-size', '10px')
      .attr('fill', '#4b5563');
    
    // Add "Legend:" label
    legendContainer.append('text')
      .attr('x', 5)
      .attr('y', 15)
      .text('Legend:')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .attr('fill', '#1f2937');

    // Add connection quality legend
    const legend = legendContainer
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(60, 5)`);

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
    const directionLegend = legendContainer
      .append('g')
      .attr('class', 'direction-legend')
      .attr('transform', `translate(60, 30)`);

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