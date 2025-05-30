// src/app/api/world/verify/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { proof, signal } = await request.json();
    
    if (!proof) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Proof is required' 
        }, 
        { status: 400 }
      );
    }

    // Get World ID configuration from environment variables
    const app_id = process.env.NEXT_PUBLIC_WORLD_APP_ID;
    const action = process.env.WORLD_ACTION_ID || 'verify-human';
    
    if (!app_id || !app_id.startsWith('app_')) {
      console.error('World ID app_id not configured or invalid format');
      return NextResponse.json(
        { 
          success: false, 
          message: 'World ID not properly configured' 
        }, 
        { status: 500 }
      );
    }

    // Verify the proof with World ID's Developer Portal API directly
    const verifyResponse = await fetch('https://developer.worldcoin.org/api/v1/verify/' + app_id, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nullifier_hash: proof.nullifier_hash,
        merkle_root: proof.merkle_root,
        proof: proof.proof,
        verification_level: proof.verification_level,
        action: action,
        signal: signal || '',
      }),
    });

    const verifyData = await verifyResponse.json();

    if (verifyResponse.ok && verifyData.success !== false) {
      // Successful verification
      console.log('World ID verification successful:', {
        nullifier_hash: proof.nullifier_hash,
        verification_level: proof.verification_level
      });

      return NextResponse.json({
        success: true,
        nullifier_hash: proof.nullifier_hash,
        verification_level: proof.verification_level,
        message: 'World ID verification successful'
      });
    } else {
      // Failed verification
      console.error('World ID verification failed:', verifyData);
      
      return NextResponse.json(
        { 
          success: false, 
          message: verifyData.detail || verifyData.message || 'World ID verification failed',
          code: verifyData.code
        }, 
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('World ID verification error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Verification processing error' 
      }, 
      { status: 500 }
    );
  }
}