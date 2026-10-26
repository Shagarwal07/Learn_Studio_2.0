import { NextResponse } from 'next/server';
import { batchResultsData } from '@/data/batchResults';

export async function GET() {
  // Returns batch results as standard JSON API.
  // Can be seamlessly connected to PostgreSQL / Spring Boot backend in the future without UI refactoring.
  return NextResponse.json({
    success: true,
    data: batchResultsData
  });
}
