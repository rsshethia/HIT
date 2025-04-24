import React, { useEffect, useRef } from 'react';
import * as Plot from '@observablehq/plot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ObservablePlotProps {
  title: string;
  description?: string;
  width?: number;
  height?: number;
  className?: string;
  data: Array<any>;
}

export default function ObservablePlot({
  title,
  description,
  width = 800,
  height = 500,
  className = '',
  data
}: ObservablePlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !data.length) return;

    // Clear any existing plot
    containerRef.current.innerHTML = '';

    // Create a simple bar chart as an example
    const chart = Plot.plot({
      width,
      height,
      marginLeft: 60,
      marginBottom: 40,
      y: {
        grid: true,
        label: 'Value'
      },
      x: {
        label: 'Label'
      },
      marks: [
        Plot.barY(data, {
          x: (d) => d.label,
          y: (d) => d.value,
          fill: (d) => d.color || 'steelblue',
          tip: true,
        }),
        Plot.ruleY([0])
      ]
    });

    // Append the plot to the container
    containerRef.current.appendChild(chart);

    // Cleanup function to remove the plot when component unmounts
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, width, height]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div ref={containerRef} className="overflow-auto"></div>
        </div>
      </CardContent>
    </Card>
  );
}