import { NextResponse } from 'next/server';
import { seedSBUGoals } from '@/lib/seed-goals';

/**
 * API endpoint to seed SBU goals into PocketBase
 * Call this once: POST /api/admin/seed-goals
 * 
 * This is a one-time setup endpoint - can be disabled after running
 */
export async function POST() {
  try {
    // Optional: Add admin auth check here
    // For now, anyone can call this - consider adding auth in production
    
    const result = await seedSBUGoals();
    
    return NextResponse.json({
      success: true,
      message: 'SBU goals seeded successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Seed goals error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to seed goals',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to seed SBU goals',
    endpoint: '/api/admin/seed-goals',
    method: 'POST',
  });
}

