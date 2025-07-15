// src/app/api/generateChallengeNFT/route.ts
import { NextRequest, NextResponse } from 'next/server';

const { Nft } = require('@chaingpt/nft');

export async function POST(request: NextRequest) {
  try {
    const { challengeTitle, challengeDescription, trophyPrompt } = await request.json();

    if (!challengeTitle || !trophyPrompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });

    console.log('Generating NFT with ChainGPT SDK...');
    console.log('Prompt:', trophyPrompt);

    // Use generateNft() with ALL required parameters based on the error message
    const result = await nftInstance.generateNft({
      walletAddress: "0x48Cd52D541A2d130545f3930F5330Ef31cD22B95",
      prompt: trophyPrompt,
      model: "velogen",
      height: 512,        // Required: must be >= 1
      width: 512,         // Required: must be >= 1  
      amount: 1,          // Required: must be 1-10000
      chainId: 137        // Required: Polygon = 137, BSC = 56
    });

    console.log('✅ ChainGPT SDK success:', JSON.stringify(result, null, 2));

    // Check what the actual response structure contains
    const collectionId = result?.collectionId || result?.id || result?.data?.collectionId;

    if (!collectionId) {
      console.log('❌ No collection ID found in result');
      return NextResponse.json({
        error: 'No collection ID in response',
        details: 'Response did not contain a collection ID',
        response: result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      collectionId: collectionId,
      message: 'NFT generation completed with ChainGPT',
    });

  } catch (error: any) {
    console.error('ChainGPT SDK error:', error);
    
    if (error.isNftError) {
      return NextResponse.json({ 
        error: 'ChainGPT SDK Error',
        details: error.message || 'Unknown SDK error'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to generate NFT',
      details: error.message 
    }, { status: 500 });
  }
}