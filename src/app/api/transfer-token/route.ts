// src/app/api/transfer-token/route.ts - Enhanced with on-chain metadata storage + DEBUG LOGS
import { NextRequest, NextResponse } from 'next/server';
import { transferTokens, EnhancedTransferTokensParams } from '../../../lib/flow/tokenService';

export async function POST(request: NextRequest) {
  try {
    const body: EnhancedTransferTokensParams = await request.json();
    const { 
      recipientAddress, 
      amount, 
      description, 
      challengeData 
    } = body;

    // Validate input
    if (!recipientAddress || !amount || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: recipientAddress, amount, description' 
      }, { status: 400 });
    }

    // Validate Flow address format (0x followed by 16 hex characters)
    if (!/^0x[a-fA-F0-9]{16}$/.test(recipientAddress)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid Flow wallet address format' 
      }, { status: 400 });
    }

    // Validate amount (should be positive and match expected reward range)
    if (amount <= 0 || amount > 1000) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token amount' 
      }, { status: 400 });
    }

    // Validate that media data exists for on-chain storage
    if (!challengeData.media || !challengeData.media.videoCID || !challengeData.media.photoCID) {
      return NextResponse.json({ 
        success: false, 
        error: 'Challenge media (videoCID and photoCID) is required for on-chain storage' 
      }, { status: 400 });
    }

    console.log('🚀 Starting enhanced Flow token transfer with on-chain metadata:', {
      recipient: recipientAddress,
      amount: amount,
      challenge: challengeData.title,
      videoCID: challengeData.media.videoCID.substring(0, 20) + '...',
      photoCID: challengeData.media.photoCID.substring(0, 20) + '...',
      hasStorachaLinks: !!challengeData.media.storachaLinks
    });

    // 🔧 DEBUG: Add comprehensive logging before calling transferTokens
    console.log('🔧 DEBUG: About to call enhanced transferTokens function');
    console.log('🔧 DEBUG: Transfer tokens function type:', typeof transferTokens);
    console.log('🔧 DEBUG: Full challenge data received:', {
      title: challengeData.title,
      challengerName: challengeData.challengerName,
      verificationResult: challengeData.verificationResult,
      media: challengeData.media,
      timestamp: challengeData.timestamp
    });
    console.log('🔧 DEBUG: Video CID (full):', challengeData.media.videoCID);
    console.log('🔧 DEBUG: Photo CID (full):', challengeData.media.photoCID);
    console.log('🔧 DEBUG: Storacha links:', challengeData.media.storachaLinks);

    // Use the enhanced tokenService with on-chain storage
    const result = await transferTokens({
      recipientAddress,
      amount,
      description,
      challengeData
    });

    // 🔧 DEBUG: Log the result from transferTokens
    console.log('🔧 DEBUG: Enhanced transfer result received:', {
      success: result.success,
      transactionId: result.transactionId,
      error: result.error,
      hasTransactionId: !!result.transactionId
    });

    if (result.success) {
      // Log the successful transfer with on-chain metadata storage
      console.log('📊 Enhanced token transfer completed with on-chain metadata:', {
        recipient: recipientAddress,
        amount: amount,
        transactionId: result.transactionId,
        challenge: challengeData.title,
        description: description,
        onChainData: {
          videoCID: challengeData.media.videoCID,
          photoCID: challengeData.media.photoCID,
          videoURL: challengeData.media.storachaLinks.video,
          photoURL: challengeData.media.storachaLinks.photo,
          verificationScore: challengeData.verificationResult?.overallConfidence || 0.75,
          challengerName: challengeData.challengerName || 'Nocena AI',
          timestamp: new Date().toISOString()
        }
      });

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        onChainData: {
          videoCID: challengeData.media.videoCID,
          photoCID: challengeData.media.photoCID,
          videoURL: challengeData.media.storachaLinks.video,
          photoURL: challengeData.media.storachaLinks.photo,
          challenge: challengeData.title,
          verificationScore: challengeData.verificationResult?.overallConfidence || 0.75,
          description: description,
          recipient: recipientAddress,
          amount: amount
        },
        message: 'Challenge completion and metadata permanently stored on Flow blockchain'
      });
    } else {
      // 🔧 DEBUG: Log failure details
      console.log('🔧 DEBUG: Enhanced transfer FAILED:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    // 🔧 DEBUG: Log any caught errors
    console.error('🔧 DEBUG: Caught error in transfer-token API:', error);
    console.error('💥 Enhanced token transfer API error:', error);
    
    let errorMessage = 'Unknown error occurred during enhanced token transfer';
    
    if (error instanceof Error) {
      console.log('🔧 DEBUG: Error message:', error.message);
      console.log('🔧 DEBUG: Error stack:', error.stack);
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Transaction timeout - please try again';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in sender account';
      } else if (error.message.includes('invalid address')) {
        errorMessage = 'Invalid recipient address';
      } else if (error.message.includes('media')) {
        errorMessage = 'Missing or invalid media data for on-chain storage';
      } else if (error.message.includes('CID')) {
        errorMessage = 'Invalid Storacha CID format - ensure files are uploaded to Storacha first';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// Optional: Add a GET endpoint to query on-chain challenge events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = searchParams.get('limit') || '10';
    
    if (!address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Address parameter is required' 
      }, { status: 400 });
    }

    // This would query the Flow blockchain for ChallengeCompleted events
    // For now, return a placeholder response
    console.log('🔍 Querying challenge completions for address:', address);

    return NextResponse.json({
      success: true,
      address: address,
      message: 'Challenge completions are stored on-chain in ChallengeCompleted events',
      note: 'Use Flow event indexing services to query historical challenge completions',
      eventType: 'A.a622afad07f6739e.ChallengeCompleted',
      queryExample: `Use Flow's event API to query for ChallengeCompleted events where recipient == ${address}`
    });

  } catch (error) {
    console.error('💥 Error querying challenge completions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to query challenge completions'
    }, { status: 500 });
  }
}