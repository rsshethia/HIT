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

interface NetworkDiagramProps {
  systems: System[];
  connections: Connection[];
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showExportLabels?: boolean;
}

const NetworkDiagram: React.FC<NetworkDiagramProps> = ({
  systems,
  connections,
  width = 800,
  height = 600,
  className = '',
  title = 'Integration Map Diagram',
  subtitle = 'System Connection Map', 
  showExportLabels = false,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !systems.length || !connections.length) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Add title and subtitle for exports
    if (showExportLabels) {
      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('font-weight', 'bold')
        .attr('fill', '#111827')
        .text(title);

      // Add subtitle
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 70)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('fill', '#4B5563')
        .text(`${systems.length} Systems and ${connections.length} Connections`);

      // Add date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 95)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#6B7280')
        .text(`Generated on: ${currentDate}`);
    }

    // Main visualization group, offset to the right
    const mainG = svg.append('g')
      .attr('transform', `translate(${width / 2 + 80}, ${height / 2})`);

    // Define arrow markers for directed links
    svg.append('defs')
      .selectAll('marker')
      .data(['end', 'end-automated', 'end-semi-automated', 'end-manual'])
      .enter()
      .append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30) // Increased to accommodate larger nodes
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => {
        if (d === 'end-automated') return '#10b981'; // Green
        if (d === 'end-semi-automated') return '#f59e0b'; // Orange
        if (d === 'end-manual') return '#ef4444'; // Red
        return '#6b7280'; // Gray default
      });

    // Prepare the data for the force simulation
    const nodeData = systems.map(system => ({
      ...system,
      id: system.id,
      name: system.name,
      // Add required properties for SimulationNodeDatum
      index: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fx: null as (number | null),
      fy: null as (number | null),
    }));

    const linkData = connections.map(connection => ({
      source: connection.source,
      target: connection.target,
      direction: connection.direction,
      quality: connection.quality,
    }));

    // Create a force simulation with better distribution
    const simulation = d3
      .forceSimulation(nodeData)
      .force(
        'link',
        d3
          .forceLink(linkData)
          .id((d: any) => d.id)
          .distance(180) // Increased distance between nodes
      )
      .force('charge', d3.forceManyBody().strength(-800)) // Stronger repulsion
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(80)); // Larger collision radius

    // Add links
    const link = mainG
      .selectAll('.link')
      .data(linkData)
      .enter()
      .append('path')
      .attr('id', (d, i) => `path-${i}`) // Add ID for the textPath
      .attr('class', 'link')
      .attr('stroke', (d: any) => {
        if (d.quality === 'automated') return '#10b981'; // Green
        if (d.quality === 'semi-automated') return '#f59e0b'; // Orange
        return '#ef4444'; // Red
      })
      .attr('stroke-width', 3) // Thicker lines for visibility
      .attr('fill', 'none')
      .attr('marker-end', (d: any) => {
        if (d.quality === 'automated') return 'url(#end-automated)';
        if (d.quality === 'semi-automated') return 'url(#end-semi-automated)';
        return 'url(#end-manual)';
      });

    // Add nodes with improved visibility
    const node = mainG
      .selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, any>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // Add circles to nodes with improved styling
    node
      .append('circle')
      .attr('r', 35) // Larger radius
      .attr('fill', '#f0f9ff') // Light blue background
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3); // Thicker border

    // Add text to nodes with improved readability
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0em')
      .text((d: any) => d.name.split(' ')[0])
      .attr('font-size', '12px') // Larger font
      .attr('font-weight', 'bold')
      .attr('fill', '#1e3a8a'); // Darker blue

    // Add second line of text if name has multiple words
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .text((d: any) => {
        const parts = d.name.split(' ');
        return parts.length > 1 ? parts.slice(1, 3).join(' ') : '';
      })
      .attr('font-size', '10px') // Larger font
      .attr('fill', '#1e3a8a')
      .attr('class', 'second-line');

    // Update positions on each tick of the simulation
    simulation.on('tick', () => {
      // Update link paths
      link.attr('d', (d: any) => {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;

        // Calculate the angle between nodes
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const angle = Math.atan2(dy, dx);

        // Offset for bidirectional links
        const offset = d.direction === 'bidirectional' ? 8 : 0;

        // Calculate perpendicular offset for bidirectional links
        const offsetX = offset * Math.sin(angle);
        const offsetY = -offset * Math.cos(angle);

        return `M${sourceX + offsetX},${sourceY + offsetY} L${targetX + offsetX},${targetY + offsetY}`;
      });

      // Update node positions
      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // Drag functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Add a legend in the bottom left corner
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, ${height - 180})`);

    // Add a white background to the legend for better readability
    legend
      .append('rect')
      .attr('x', -10)
      .attr('y', -10)
      .attr('width', 270)
      .attr('height', 170)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('rx', 5)
      .attr('ry', 5);

    // Create legend items
    const qualities = [
      { quality: 'automated', label: 'Automatic Data Flow', color: '#10b981', description: 'No manual intervention needed' },
      { quality: 'semi-automated', label: 'Partial Manual Process', color: '#f59e0b', description: 'Some staff input required' },
      { quality: 'manual', label: 'Fully Manual Process', color: '#ef4444', description: 'Staff must re-enter information' },
    ];

    // Create legend items with descriptions
    legend
      .selectAll('.legend-item')
      .data(qualities)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 40})`) // Increased spacing
      .each(function(d) {
        const g = d3.select(this);
        g.append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', 30)
          .attr('y2', 0)
          .attr('stroke', d.color)
          .attr('stroke-width', 3); // Slightly thicker for visibility

        g.append('text')
          .attr('x', 40)
          .attr('y', 4)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .attr('fill', '#374151');

        // Add description text
        g.append('text')
          .attr('x', 40)
          .attr('y', 22)
          .text(d.description)
          .attr('font-size', '10px')
          .attr('fill', '#6B7280');
      });

    // Add a node example to the legend
    const nodeExample = legend.append('g')
      .attr('transform', `translate(15, ${qualities.length * 40 + 10})`);

    nodeExample.append('circle')
      .attr('r', 15)
      .attr('fill', '#f0f9ff')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    nodeExample.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('System')
      .attr('font-size', '8px')
      .attr('fill', '#1e3a8a');

    legend.append('text')
      .attr('x', 40)
      .attr('y', qualities.length * 40 + 15)
      .text('Clinical System/Application')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151');

    // Add interaction instructions
    svg.append('text')
      .attr('x', 20)
      .attr('y', height - 20)
      .text('Tip: Drag systems to rearrange the diagram')
      .attr('font-size', '12px')
      .attr('font-style', 'italic')
      .attr('fill', '#6B7280');

    // Simulation cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [systems, connections, width, height, title, subtitle, showExportLabels]);

  return (
    <div className={`network-diagram-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default NetworkDiagram;