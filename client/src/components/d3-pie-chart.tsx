import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataItem[];
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  title?: string;
  className?: string;
}

const D3PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 400,
  innerRadius = 0,
  outerRadius = 150,
  title,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie chart generator
    const pie = d3.pie<DataItem>().value((d) => d.value);
    const pieData = pie(data);

    // Create arc generator
    const arc = d3.arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    // Create arcs
    const arcs = svg
      .selectAll('arc')
      .data(pieData)
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add path elements
    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
      });

    // Add labels to arcs
    arcs
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .text((d) => (d.data.value >= 5 ? d.data.name : ''));

    // Add percentage labels
    arcs
      .append('text')
      .attr('transform', (d) => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y + 15})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .text((d) => (d.data.value >= 5 ? `${Math.round((d.data.value / d3.sum(data, d => d.value)) * 100)}%` : ''));

    // Add title if provided
    if (title) {
      svg
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'hanging')
        .attr('y', -outerRadius - 20)
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text(title);
    }

    // Add legend
    const legend = svg
      .selectAll('.legend')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => `translate(${outerRadius + 10}, ${-outerRadius + 25 + i * 20})`);

    legend
      .append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', (d) => d.color);

    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 6)
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .text((d) => `${d.name} (${d.value})`);

  }, [data, width, height, innerRadius, outerRadius, title]);

  return (
    <div className={`d3-pie-chart-container ${className}`}>
      <svg ref={svgRef} />
    </div>
  );
};

export default D3PieChart;