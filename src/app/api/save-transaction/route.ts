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

    console.log('💾 Saving transaction ID to Dgraph storage:', transactionId);

    // Save only the transaction ID to Dgraph - everything else comes from on-chain
    const transactionRecord = await minimalStorage.saveTransaction(transactionId);

    console.log('✅ Transaction ID saved to Dgraph storage:', transactionRecord.id);

    return NextResponse.json({
      success: true,
      recordId: transactionRecord.id,
      transactionId,
      message: 'Transaction ID saved to Dgraph - all data fetched from Flow blockchain',
      storage: 'Dgraph'
    });

  } catch (error) {
    console.error('💥 Error saving transaction ID to Dgraph:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save transaction ID to Dgraph',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get basic stats from Dgraph storage
        const basicStats = await minimalStorage.getStats();
        
        // Get all transaction IDs and fetch on-chain stats
        const transactions = await minimalStorage.getAllTransactions();
        const transactionIds = transactions.map(t => t.transactionId);
        
        let onChainStats = null;
        if (transactionIds.length > 0) {
          console.log('📊 Fetching on-chain stats for transactions from Dgraph:', transactionIds.length);
          onChainStats = await onChainDataService.getOnChainStats(transactionIds);
        }
        
        return NextResponse.json({ 
          success: true, 
          basicStats: {
            ...basicStats,
            storage: 'Dgraph'
          },
          onChainStats
        });
        
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        console.log(`🕒 Fetching ${limit} recent transactions from Dgraph`);
        const recent = await minimalStorage.getRecentTransactions(limit);
        return NextResponse.json({ 
          success: true, 
          transactions: recent,
          storage: 'Dgraph'
        });
        
      case 'info':
        // Get storage info from Dgraph (replaces file info)
        const stats = await minimalStorage.getStats();
        const allTransactions = await minimalStorage.getAllTransactions();
        
        const storageInfo = {
          storage: 'Dgraph',
          totalRecords: allTransactions.length,
          maxRecords: 3,
          lastUpdated: new Date().toISOString(),
          endpoint: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT,
          note: 'Transaction storage using Dgraph instead of local filesystem'
        };
        
        return NextResponse.json({ 
          success: true, 
          storageInfo,
          stats
        });
        
      case 'onchain':
        // Fetch on-chain data for all stored transaction IDs from Dgraph
        console.log('⛓️ Starting on-chain data fetch from Dgraph storage...');
        const storedTransactions = await minimalStorage.getAllTransactions();
        const storedTransactionIds = storedTransactions.map(t => t.transactionId);
        
        console.log(`🔍 Fetching on-chain data for ${storedTransactionIds.length} transactions from Dgraph:`, storedTransactionIds);
        
        let onChainData: any[] = [];
        if (storedTransactionIds.length > 0) {
          onChainData = await onChainDataService.getMultipleTransactions(storedTransactionIds);
        }
        
        return NextResponse.json({ 
          success: true, 
          transactions: storedTransactions,
          onChainData,
          storage: 'Dgraph',
          message: `All challenge data fetched from Flow blockchain (${storedTransactionIds.length} transactions from Dgraph)`
        });
        
      case 'clear':
        // Clear all transactions from Dgraph (for testing)
        console.log('🗑️ Clearing all transactions from Dgraph storage...');
        await minimalStorage.clearAll();
        return NextResponse.json({ 
          success: true, 
          message: 'All transactions cleared from Dgraph storage'
        });
        
      default:
        console.log('📋 Fetching all transactions from Dgraph storage...');
        const all = await minimalStorage.getAllTransactions();
        return NextResponse.json({ 
          success: true, 
          transactions: all,
          storage: 'Dgraph',
          count: all.length
        });
    }

  } catch (error) {
    console.error('💥 Error retrieving transaction data from Dgraph:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve transaction data from Dgraph',
      details: error instanceof Error ? error.message : 'Unknown error',
      storage: 'Dgraph'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE request - clearing all transactions from Dgraph...');
    await minimalStorage.clearAll();
    
    return NextResponse.json({
      success: true,
      message: 'All transactions cleared from Dgraph storage',
      storage: 'Dgraph'
    });
  } catch (error) {
    console.error('💥 Error clearing transactions from Dgraph:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear transactions from Dgraph',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}