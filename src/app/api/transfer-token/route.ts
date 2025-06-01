// src/app/api/transfer-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { transferTokens, TransferTokensParams } from '../../../lib/flow/tokenService';

export async function POST(request: NextRequest) {
  try {
    const body: TransferTokensParams = await request.json();
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

    console.log('🚀 Starting Flow token transfer via tokenService:', {
      recipient: recipientAddress,
      amount: amount,
      challenge: challengeData.title
    });

    // Use the proper tokenService.ts
    const result = await transferTokens({
      recipientAddress,
      amount,
      description,
      challengeData
    });

    if (result.success) {
      // Log the successful transfer
      console.log('📊 Token transfer completed:', {
        recipient: recipientAddress,
        amount: amount,
        transactionId: result.transactionId,
        challenge: challengeData.title,
        description: description,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        transactionId: result.transactionId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Token transfer API error:', error);
    
    let errorMessage = 'Unknown error occurred during token transfer';
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Transaction timeout - please try again';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in sender account';
      } else if (error.message.includes('invalid address')) {
        errorMessage = 'Invalid recipient address';
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