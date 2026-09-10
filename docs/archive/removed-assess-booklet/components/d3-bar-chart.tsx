import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataItem[];
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  className?: string;
}

const D3BarChart: React.FC<BarChartProps> = ({
  data,
  width = 600,
  height = 400,
  marginTop = 40,
  marginRight = 30,
  marginBottom = 60,
  marginLeft = 60,
  title,
  xAxisLabel,
  yAxisLabel,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Calculate chart dimensions
    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${marginLeft}, ${marginTop})`);

    // Create scales
    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, chartWidth])
      .padding(0.3);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .nice()
      .range([chartHeight, 0]);

    // Create default color scale
    const defaultColorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Add the X-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '12px');

    // Add the Y-axis
    svg.append('g').call(d3.axisLeft(yScale));

    // Add title if provided
    if (title) {
      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', -marginTop / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(title);
    }

    // Add X-axis label if provided
    if (xAxisLabel) {
      svg
        .append('text')
        .attr('x', chartWidth / 2)
        .attr('y', chartHeight + marginBottom - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text(xAxisLabel);
    }

    // Add Y-axis label if provided
    if (yAxisLabel) {
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -marginLeft + 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .text(yAxisLabel);
    }

    // Add the bars
    svg
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => xScale(d.label) || 0)
      .attr('y', (d) => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => chartHeight - yScale(d.value))
      .attr('fill', (d) => d.color || defaultColorScale(d.label))
      .attr('rx', 4) // rounded corners
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        
        // Show tooltip
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${xScale(d.label)! + xScale.bandwidth() / 2}, ${yScale(d.value) - 15})`);
          
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(d.value);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
        svg.select('.tooltip').remove();
      });

    // Add value labels above bars
    svg
      .selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => (xScale(d.label) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text((d) => d.value);

  }, [data, width, height, marginTop, marginRight, marginBottom, marginLeft, title, xAxisLabel, yAxisLabel]);

  return (
    <div className={`d3-bar-chart-container ${className}`}>
      <svg ref={svgRef} />
    </div>
  );
};

export default D3BarChart;