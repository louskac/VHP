// src/app/api/save-transaction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { minimalStorage } from '../../../lib/storage/minimalStorage';
import { onChainDataService } from '../../../lib/flow/onChainDataService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId } = body;

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Transaction ID is required'
      }, { status: 400 });
    }

    console.log('💾 Saving transaction ID to minimal storage:', transactionId);

    // Save only the transaction ID - everything else comes from on-chain
    const transactionRecord = await minimalStorage.saveTransaction(transactionId);

    console.log('✅ Transaction ID saved to minimal storage:', transactionRecord.id);

    return NextResponse.json({
      success: true,
      recordId: transactionRecord.id,
      transactionId,
      message: 'Transaction ID saved - all data fetched from Flow blockchain',
      publicUrl: '/data/vhp-transactions.json'
    });

  } catch (error) {
    console.error('💥 Error saving transaction ID:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save transaction ID'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get basic stats from minimal storage
        const basicStats = await minimalStorage.getStats();
        
        // Get all transaction IDs and fetch on-chain stats
        const transactions = await minimalStorage.getAllTransactions();
        const transactionIds = transactions.map(t => t.transactionId);
        
        let onChainStats = null;
        if (transactionIds.length > 0) {
          onChainStats = await onChainDataService.getOnChainStats(transactionIds);
        }
        
        return NextResponse.json({ 
          success: true, 
          basicStats,
          onChainStats
        });
        
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const recent = await minimalStorage.getRecentTransactions(limit);
        return NextResponse.json({ success: true, transactions: recent });
        
      case 'info':
        const fileInfo = await minimalStorage.getFileInfo();
        return NextResponse.json({ success: true, fileInfo });
        
      case 'onchain':
        // Fetch on-chain data for all stored transaction IDs
        const allTransactions = await minimalStorage.getAllTransactions();
        const allTransactionIds = allTransactions.map(t => t.transactionId);
        
        console.log('🔍 Fetching on-chain data for transactions:', allTransactionIds.length);
        const onChainData = await onChainDataService.getMultipleTransactions(allTransactionIds);
        
        return NextResponse.json({ 
          success: true, 
          transactions: allTransactions,
          onChainData,
          message: 'All challenge data fetched from Flow blockchain'
        });
        
      default:
        const all = await minimalStorage.getAllTransactions();
        return NextResponse.json({ success: true, transactions: all });
    }

  } catch (error) {
    console.error('💥 Error retrieving transaction data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve transaction data'
    }, { status: 500 });
  }
}