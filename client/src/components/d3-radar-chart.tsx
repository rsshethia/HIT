import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  axis: string;
  value: number;
}

interface RadarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  maxValue?: number;
  levels?: number;
  labelFactor?: number;
  wrapWidth?: number;
  opacityArea?: number;
  dotRadius?: number;
  opacityCircles?: number;
  strokeWidth?: number;
  roundStrokes?: boolean;
  color?: string;
  title?: string;
  className?: string;
}

const D3RadarChart: React.FC<RadarChartProps> = ({
  data,
  width = 500,
  height = 500,
  maxValue = 10,
  levels = 5,
  labelFactor = 1.25,
  wrapWidth = 100,
  opacityArea = 0.35,
  dotRadius = 4,
  opacityCircles = 0.1,
  strokeWidth = 2,
  roundStrokes = true,
  color = "#2373B8",
  title,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Config
    const cfg = {
      w: width,
      h: height,
      margin: { top: 50, right: 50, bottom: 50, left: 50 },
      maxValue,
      levels,
      labelFactor,
      wrapWidth,
      opacityArea,
      dotRadius,
      opacityCircles,
      strokeWidth,
      roundStrokes,
      color,
      transformScale: 0.9  // scale to ensure it fits in the SVG
    };

    const allAxis = data.map(d => d.axis);
    const total = allAxis.length;
    const radius = Math.min(cfg.w/2, cfg.h/2) * cfg.transformScale;
    const angleSlice = Math.PI * 2 / total;

    // Create scales
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, cfg.maxValue]);

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr("width", cfg.w)
      .attr("height", cfg.h)
      .append("g")
      .attr("transform", `translate(${cfg.w/2}, ${cfg.h/2})`);

    // Circular grid
    const axisGrid = svg.append("g").attr("class", "axisWrapper");

    // Draw background circles
    axisGrid.selectAll(".levels")
      .data(d3.range(1, (cfg.levels+1)).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", d => radius*d/cfg.levels)
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", cfg.opacityCircles)
      .style("filter" , "url(#glow)");

    // Text labels for each level
    axisGrid.selectAll(".axisLabel")
      .data(d3.range(1, (cfg.levels+1)).reverse())
      .enter().append("text")
      .attr("class", "axisLabel")
      .attr("x", 4)
      .attr("y", d => -d*radius/cfg.levels)
      .attr("dy", "0.4em")
      .style("font-size", "10px")
      .attr("fill", "#737373")
      .text(d => Math.round(cfg.maxValue * d / cfg.levels));

    // Create axis lines
    const axis = axisGrid.selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");

    // Append lines
    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(cfg.maxValue) * Math.cos(angleSlice*i - Math.PI/2))
      .attr("y2", (d, i) => rScale(cfg.maxValue) * Math.sin(angleSlice*i - Math.PI/2))
      .attr("class", "line")
      .style("stroke", "white")
      .style("stroke-width", "2px");

    // Append axis labels
    axis.append("text")
      .attr("class", "legend")
      .style("font-size", "11px")
      .style("fill", "#737373")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2))
      .attr("y", (d, i) => rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2))
      .text(d => d)
      .call(wrap, cfg.wrapWidth);

    // Draw radar chart blobs
    const radarLine = d3.lineRadial<DataPoint>()
      .curve(d3.curveLinearClosed)
      .radius(d => rScale(d.value))
      .angle((d, i) => i * angleSlice);

    if (cfg.roundStrokes) {
      radarLine.curve(d3.curveCardinalClosed);
    }

    // Create a wrapper for the blobs
    const blobWrapper = svg.selectAll(".radarWrapper")
      .data([data])
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // Append the backgrounds
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", d => radarLine(d) || "")
      .style("fill", cfg.color)
      .style("fill-opacity", cfg.opacityArea)
      .on('mouseover', function() {
        d3.select(this).transition().duration(200).style("fill-opacity", 0.7);
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).style("fill-opacity", cfg.opacityArea);
      });

    // Create the outlines
    blobWrapper.append("path")
      .attr("class", "radarStroke")
      .attr("d", d => radarLine(d) || "")
      .style("stroke-width", cfg.strokeWidth)
      .style("stroke", cfg.color)
      .style("fill", "none")
      .style("filter", "url(#glow)");

    // Append dots
    blobWrapper.selectAll(".radarCircle")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", cfg.dotRadius)
      .attr("cx", (d, i) => rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2))
      .attr("cy", (d, i) => rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2))
      .style("fill", cfg.color)
      .style("fill-opacity", 0.8);

    // Add title if provided
    if (title) {
      svg.append("text")
        .attr("x", 0)
        .attr("y", -height/2 + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(title);
    }

    // Helper function to wrap text
    function wrap(text: d3.Selection<d3.BaseType, unknown, d3.BaseType, unknown>, width: number) {
      text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.4; // ems
        const y = text.attr("y");
        const x = text.attr("x");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node()?.getComputedTextLength() && tspan.node()?.getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
        }
      });
    }

  }, [data, width, height, maxValue, levels, labelFactor, wrapWidth, opacityArea, dotRadius, opacityCircles, strokeWidth, roundStrokes, color, title]);

  return (
    <div className={`d3-radar-chart-container ${className}`}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3RadarChart;