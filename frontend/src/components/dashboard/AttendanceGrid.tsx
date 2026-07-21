'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  attendanceData: any;
}

export default function AttendanceGrid({ attendanceData }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    d3.select(chartRef.current).selectAll('*').remove();

    // Mockup shows 3 rows of dots, about 7 columns
    const cols = 7;
    const rows = 3;
    const totalDots = cols * rows;
    
    // Create dummy data representing days. Green = present, blue/purple = absent/weekend
    const data = Array.from({ length: totalDots }).map((_, i) => ({
      id: i,
      status: Math.random() > 0.3 ? 'present' : 'absent'
    }));

    const width = 200;
    const height = 80;
    const padding = 4;
    const dotSize = 14;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'dot')
      .attr('x', (d, i) => (i % cols) * (dotSize + padding) + 20)
      .attr('y', (d, i) => Math.floor(i / cols) * (dotSize + padding) + 10)
      .attr('width', dotSize)
      .attr('height', dotSize)
      .attr('rx', 4) // Rounded squares
      .attr('fill', d => d.status === 'present' ? '#22C55E' : '#30364F') // Green or dark blue
      .style('opacity', d => d.status === 'present' ? 0.8 + Math.random() * 0.2 : 0.5);

  }, [attendanceData]);

  return (
    <div className="glass-card p-6 rounded-3xl flex flex-col justify-between h-full border border-border-color">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-extrabold text-foreground">Attendance</h3>
      </div>
      
      {attendanceData && attendanceData.offlineTotal > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center mt-2">
          <div ref={chartRef} />
          
          <div className="w-full mt-4">
            <p className="text-[8px] font-extrabold text-text-muted uppercase tracking-wider mb-2">Daily Learning Time</p>
            <div className="space-y-1.5">
              <div className="w-full bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary-blue h-full w-3/4 rounded-full" />
              </div>
              <div className="w-3/4 bg-bg-secondary-dark h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent-grape h-full w-1/2 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
          <span className="text-xl">📅</span>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-2">Not Available</p>
          <p className="text-[9px] text-text-muted/60 mt-1">Not enough data</p>
        </div>
      )}
    </div>
  );
}
