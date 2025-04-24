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
  title = 'Network Diagram',
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
        .text(subtitle);
        
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
    
    // Main visualization group, centered in SVG
    const mainG = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Define arrow markers for directed links
    svg
      .append('defs')
      .selectAll('marker')
      .data(['end', 'end-automated', 'end-semi-automated', 'end-manual'])
      .enter()
      .append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => {
        if (d === 'end-automated') return '#10b981';
        if (d === 'end-semi-automated') return '#f59e0b';
        if (d === 'end-manual') return '#ef4444';
        return '#6b7280';
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

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodeData)
      .force(
        'link',
        d3
          .forceLink(linkData)
          .id((d: any) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(70));

    // Add links
    const link = svg
      .selectAll('.link')
      .data(linkData)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('stroke', (d: any) => {
        if (d.quality === 'automated') return '#10b981';
        if (d.quality === 'semi-automated') return '#f59e0b';
        return '#ef4444';
      })
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', (d: any) => {
        if (d.quality === 'automated') return 'url(#end-automated)';
        if (d.quality === 'semi-automated') return 'url(#end-semi-automated)';
        return 'url(#end-manual)';
      });

    // Add nodes
    const node = svg
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

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', 25)
      .attr('fill', '#ffffff')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    // Add text to nodes
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text((d: any) => d.name.split(' ')[0])
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151');

    // Add second line of text if name has multiple words
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .text((d: any) => {
        const parts = d.name.split(' ');
        return parts.length > 1 ? parts.slice(1, 3).join(' ') : '';
      })
      .attr('font-size', '8px')
      .attr('fill', '#374151')
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

    // Add a legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width / 2 - 100}, ${height / 2 - 100})`);

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
          .attr('stroke-width', 2);

        g.append('text')
          .attr('x', 40)
          .attr('y', 4)
          .text(d.label)
          .attr('font-size', '12px')
          .attr('fill', '#374151');
      });

    // Simulation cleanup on unmount
    return () => {
      simulation.stop();
    };
  }, [systems, connections, width, height]);

  return (
    <div className={`network-diagram-container ${className}`}>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default NetworkDiagram;