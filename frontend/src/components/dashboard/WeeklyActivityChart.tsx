'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  quizAttempts: any[];
}

export default function WeeklyActivityChart({ quizAttempts }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    d3.select(chartRef.current).selectAll('*').remove();

    // Data prep - map to 7 bars representing recent quizzes
    const data = quizAttempts.slice(-7).map((a, i) => ({
      id: i,
      score: Math.round((a.score / a.totalQuestions) * 100),
      label: new Date(a.attemptedAt).toLocaleDateString(undefined, { weekday: 'short' })
    }));

    // Pad with empty data if less than 7
    while (data.length < 7) {
      data.unshift({ id: -data.length, score: 0, label: '-' });
    }

    const width = 280;
    const height = 140;
    const margin = { top: 10, right: 0, bottom: 20, left: 0 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.id.toString()))
      .range([0, innerWidth])
      .padding(0.4);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Defs for gradients
    const defs = svg.append('defs');
    const bgGradient = defs.append('linearGradient')
      .attr('id', 'bgGradient')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    bgGradient.append('stop').attr('offset', '0%').attr('stop-color', '#1E2335');
    bgGradient.append('stop').attr('offset', '100%').attr('stop-color', '#121623');

    // Create the background panel for the chart (like in the mockup)
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerWidth)
      .attr('height', innerHeight + margin.bottom)
      .attr('rx', 12)
      .attr('fill', 'url(#bgGradient)')
      .attr('stroke', '#30364F')
      .attr('stroke-width', 1);

    // Draw bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.id.toString())!)
      .attr('y', d => y(d.score))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.score))
      .attr('rx', x.bandwidth() / 2) // Fully rounded ends
      .attr('fill', (d, i) => i % 2 === 0 ? '#963484' : '#3066BE') // Alternating purple and blue
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');

  }, [quizAttempts]);

  return (
    <div className="glass-card p-6 rounded-3xl flex flex-col h-full border border-border-color relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-extrabold text-foreground">Weekly Activity</h3>
        <span className="text-lg font-black text-foreground">{quizAttempts.length} <span className="text-xs text-text-muted">Quizzes</span></span>
      </div>
      
      {quizAttempts.length > 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div ref={chartRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="text-xl">📊</span>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-2">Not Available</p>
          <p className="text-[9px] text-text-muted/60 mt-1">Not enough data</p>
        </div>
      )}
    </div>
  );
}
