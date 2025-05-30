// src/app/api/vhp/verify/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Generate a simple VHP token
    const vhpToken = `vhp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Always return success
    return NextResponse.json({
      success: true,
      token: vhpToken,
      message: 'Verification successful'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error' 
      }, 
      { status: 500 }
    );
  }
}