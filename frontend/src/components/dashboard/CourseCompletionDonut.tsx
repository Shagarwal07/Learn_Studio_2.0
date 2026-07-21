'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CourseCompletionDonut() {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    d3.select(chartRef.current).selectAll('*').remove();

    const width = 140;
    const height = 140;
    const margin = 10;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Background arc
    const arcBackground = d3.arc<any, any>()
      .innerRadius(radius - 12)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI)
      .cornerRadius(10);

    svg.append('path')
      .attr('d', arcBackground)
      .attr('fill', '#1E2335')
      .attr('stroke', '#30364F')
      .attr('stroke-width', 1);
  }, []);

  return (
    <div className="glass-card p-6 rounded-3xl flex flex-col justify-between h-full border border-border-color">
      <div>
        <h3 className="text-sm font-extrabold text-white leading-tight">Course<br/>Completion</h3>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center mt-4">
        <div ref={chartRef} className="relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-text-muted">0%</span>
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider mt-0.5">LOCKED</span>
          </div>
        </div>
        <p className="text-[10px] text-text-muted mt-5 font-semibold">Online courses coming soon</p>
      </div>
    </div>
  );
}
