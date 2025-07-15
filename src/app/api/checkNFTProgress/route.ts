// src/api/chaingpt/checkNFTProgress.ts
import { NextRequest, NextResponse } from 'next/server';

const { Nft } = require('@chaingpt/nft');

const nftInstance = new Nft({
  apiKey: process.env.CHAINGPT_API_KEY,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json({ error: 'Collection ID required' }, { status: 400 });
    }

    // Real ChainGPT progress check
    const progress = await nftInstance.getNftProgress({
      collectionId: collectionId,
    });

    return NextResponse.json({
      success: true,
      progress: progress
    });
  } catch (error: any) {
    console.error('Error checking progress:', error);
    return NextResponse.json({ 
      error: 'Failed to check progress',
      details: error.message 
    }, { status: 500 });
  }
}