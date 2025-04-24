import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
// Using a force-directed graph similar to the "Mobile Patent Suits" example from D3.js

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

    // Mobile Patent Suits style diagram
    // Set up colors based on integration quality
    const qualityColors = {
      'automated': '#10b981',     // Green
      'semi-automated': '#f59e0b', // Amber
      'manual': '#ef4444'         // Red
    };

    // Prepare data for force-directed graph
    const nodeData = nodes.map((node: any) => ({
      id: node.name,
      name: node.name,
      group: 1, // All nodes in the same group by default
      // Add required properties for force simulation
      index: 0,
      x: width / 2 + (Math.random() - 0.5) * 100,
      y: height / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      fx: null as (number | null),
      fy: null as (number | null),
    }));

    // Create a map for quick node lookups
    const nodesById = new Map(nodeData.map(n => [n.id, n]));

    // Create links with proper references to node objects
    const linkData = links.map(link => {
      const sourceNode = nodesById.get(link.source);
      const targetNode = nodesById.get(link.target);
      
      if (!sourceNode || !targetNode) {
        console.warn(`Missing node reference for link: ${link.source} -> ${link.target}`);
        return null;
      }
      
      return {
        source: sourceNode,
        target: targetNode,
        quality: link.quality,
        value: link.value || 1,
      };
    }).filter(link => link !== null) as any[];

    // Define arrow markers for directed links
    svg
      .append('defs')
      .selectAll('marker')
      .data(['arrow-automated', 'arrow-semi-automated', 'arrow-manual'])
      .enter()
      .append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28) // Positioned relative to the node radius
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => {
        if (d === 'arrow-automated') return '#10b981';
        if (d === 'arrow-semi-automated') return '#f59e0b';
        return '#ef4444';
      });

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force('x', d3.forceX(innerWidth / 2).strength(0.1))
      .force('y', d3.forceY(innerHeight / 2).strength(0.1))
      .force('collision', d3.forceCollide().radius(60));

    // Create links (connections between nodes)
    const link = svg
      .selectAll('.link')
      .data(linkData)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d: any) => qualityColors[d.quality as keyof typeof qualityColors] || '#9ca3af')
      .attr('stroke-width', (d: any) => Math.max(1, Math.sqrt(d.value)))
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', (d: any) => `url(#arrow-${d.quality})`)
      .on('mouseover', function(event, d: any) {
        // Highlight on hover
        d3.select(this)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', (d: any) => Math.max(2, Math.sqrt(d.value) + 1));
      })
      .on('mouseout', function(event, d: any) {
        // Restore original appearance
        d3.select(this)
          .attr('stroke-opacity', 0.8)
          .attr('stroke-width', (d: any) => Math.max(1, Math.sqrt(d.value)));
      })
      .append('title')
      .text((d: any) => `${d.source.id} → ${d.target.id}\nVolume: ${d.value} msg/hr\nQuality: ${d.quality}`);

    // Create nodes
    const node = svg
      .selectAll('.node')
      .data(nodeData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(
        d3.drag<SVGGElement, any>()
          .on('start', dragStarted)
          .on('drag', dragged)
          .on('end', dragEnded)
      );

    // Add circles to nodes 
    node
      .append('circle')
      .attr('r', 25)
      .attr('fill', '#3b82f6')
      .attr('stroke', '#1e40af')
      .attr('stroke-width', 2);

    // Add system names inside nodes
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const words = d.name.split(' ');
        return words.length > 0 ? words[0] : '';
      });

    // Add second line of text for multi-word names
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text((d: any) => {
        const words = d.name.split(' ');
        if (words.length > 1) {
          const remainingWords = words.slice(1).join(' ');
          if (remainingWords.length > 15) {
            return remainingWords.substring(0, 15) + '...';
          }
          return remainingWords;
        }
        return '';
      });

    // Update positions on each tick of the simulation
    simulation.on('tick', () => {
      // Constrain nodes to the visualization area with padding
      nodeData.forEach((d: any) => {
        d.x = Math.max(30, Math.min(innerWidth - 30, d.x));
        d.y = Math.max(30, Math.min(innerHeight - 30, d.y));
      });

      // Update link positions
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

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