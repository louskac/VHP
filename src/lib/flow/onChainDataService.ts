// src/lib/flow/onChainDataService.ts
import * as fcl from "@onflow/fcl"
import { initFlow } from "./config"

// Initialize Flow configuration
initFlow()

export interface OnChainChallengeData {
  transactionId: string;
  blockHeight: number;
  timestamp: string;
  status: string;
  challenge?: {
    title: string;
    challenger: string;
    description: string;
  };
  recipient?: {
    address: string;
    amount: number;
  };
  media?: {
    videoCID: string;
    photoCID: string;
    videoURL: string;
    photoURL: string;
  };
  verification?: {
    score: number;
    confidence: number;
  };
  logs: string[];
  events: any[];
}

class OnChainDataService {
  
  // Fetch complete transaction data from Flow blockchain
  async getTransactionData(transactionId: string): Promise<OnChainChallengeData | null> {
    try {
      console.log('🔍 Fetching on-chain data for transaction:', transactionId);
      
      // Get complete transaction details including logs
      const transaction = await fcl.send([
        fcl.getTransactionStatus(transactionId)
      ]).then(fcl.decode);
      
      if (!transaction) {
        console.warn('❌ Transaction not found:', transactionId);
        return null;
      }
  
      console.log('📊 Raw transaction data:', {
        status: transaction.status,
        blockHeight: transaction.blockHeight || 'Unknown',
        events: transaction.events?.length || 0,
        // Check if logs exist in different places
        logs: transaction.logs?.length || 0,
        errorMessage: transaction.errorMessage
      });
  
      // The key fix: get ACTUAL transaction logs, not just events
      let transactionLogs: string[] = [];
      
      // Flow transactions might store logs in different places
      if (transaction.logs) {
        transactionLogs = transaction.logs;
      } else if (transaction.events) {
        // Fallback to events if logs not available
        transactionLogs = transaction.events.map((e: any) => JSON.stringify(e));
      }
      
      console.log('📄 Transaction logs found:', transactionLogs.length);
      console.log('📄 Sample logs:', transactionLogs.slice(0, 3));
  
      // Parse the transaction logs to extract challenge metadata
      const challengeData = this.parseTransactionLogs(transaction, transactionLogs);
      
      const result: OnChainChallengeData = {
        transactionId,
        blockHeight: transaction.blockHeight || 0,
        timestamp: new Date().toISOString(),
        status: this.getStatusString(transaction.status),
        challenge: challengeData.challenge,
        recipient: challengeData.recipient,
        media: challengeData.media,
        verification: challengeData.verification,
        logs: transactionLogs, // Use actual logs
        events: transaction.events || []
      };
  
      console.log('✅ Parsed on-chain challenge data:', {
        challenge: result.challenge?.title,
        recipient: result.recipient?.address,
        amount: result.recipient?.amount,
        videoCID: result.media?.videoCID?.substring(0, 20) + '...',
        score: result.verification?.score,
        totalLogs: result.logs.length
      });
  
      return result;
  
    } catch (error) {
      console.error('💥 Error fetching on-chain data:', error);
      return null;
    }
  }

  // Fetch multiple transactions in parallel
  async getMultipleTransactions(transactionIds: string[]): Promise<OnChainChallengeData[]> {
    console.log('🔍 Fetching multiple on-chain transactions:', transactionIds.length);
    
    const promises = transactionIds.map(id => this.getTransactionData(id));
    const results = await Promise.allSettled(promises);
    
    const validResults = results
      .filter((result): result is PromiseFulfilledResult<OnChainChallengeData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    console.log(`✅ Successfully fetched ${validResults.length}/${transactionIds.length} transactions`);
    return validResults;
  }

  // Parse transaction logs to extract challenge metadata
  private parseTransactionLogs(transaction: any, logs: string[]): {
    challenge?: any;
    recipient?: any;
    media?: any;
    verification?: any;
  } {
    try {
      console.log('🔍 Parsing transaction logs for challenge metadata...');
      console.log('📄 Available logs:', logs.length);
      
      let challengeData: any = {};
  
      // Parse both JSON events and plain text logs
      logs.forEach((log: string, index: number) => {
        console.log(`📄 Processing log ${index}:`, log.substring(0, 100));
        
        // Check for plain text challenge logs (from your enhanced transaction)
        if (log.includes('Video CID:')) {
          const match = log.match(/Video CID:\s*([a-zA-Z0-9]+)/);
          if (match) {
            challengeData.media = challengeData.media || {};
            challengeData.media.videoCID = match[1];
            console.log('🎥 Found Video CID:', match[1]);
          }
        }
        
        if (log.includes('Photo CID:')) {
          const match = log.match(/Photo CID:\s*([a-zA-Z0-9]+)/);
          if (match) {
            challengeData.media = challengeData.media || {};
            challengeData.media.photoCID = match[1];
            console.log('📸 Found Photo CID:', match[1]);
          }
        }
        
        if (log.includes('Challenge Title:')) {
          const match = log.match(/Challenge Title:\s*(.+)/);
          if (match) {
            challengeData.challenge = challengeData.challenge || {};
            challengeData.challenge.title = match[1];
            console.log('🎯 Found Challenge Title:', match[1]);
          }
        }
        
        if (log.includes('Verification Score:')) {
          const match = log.match(/Verification Score:\s*([0-9.]+)/);
          if (match) {
            challengeData.verification = {
              score: Math.round(parseFloat(match[1]) * 100),
              confidence: parseFloat(match[1])
            };
            console.log('📊 Found Verification Score:', match[1]);
          }
        }
        
        // Also construct URLs if we have CIDs
        if (challengeData.media?.videoCID && challengeData.media?.photoCID) {
          challengeData.media.videoURL = `https://${challengeData.media.videoCID}.ipfs.w3s.link`;
          challengeData.media.photoURL = `https://${challengeData.media.photoCID}.ipfs.w3s.link`;
        }
      });
  
      console.log('✅ Extracted challenge metadata:', challengeData);
      return challengeData;
      
    } catch (error) {
      console.error('Error parsing transaction logs:', error);
      return {};
    }
  }

  // Extract challenge info from logs
  private extractChallengeFromLogs(logs: any[]): any {
    // This would parse the specific log format from your enhanced transaction
    // Looking for patterns like "Challenge Title: Make Funny Faces"
    const title = this.extractLogValue(logs, 'Challenge Title:');
    const challenger = this.extractLogValue(logs, 'Challenger:');
    const description = this.extractLogValue(logs, 'Description:');
    
    if (title) {
      return { title, challenger: challenger || 'VHP AI', description: description || 'VHP Verification Challenge' };
    }
    return undefined;
  }

  // Extract media info from logs
  private extractMediaFromLogs(logs: any[]): any {
    const videoCID = this.extractLogValue(logs, 'Video CID:');
    const photoCID = this.extractLogValue(logs, 'Photo CID:');
    const videoURL = this.extractLogValue(logs, 'Video URL:');
    const photoURL = this.extractLogValue(logs, 'Photo URL:');
    
    if (videoCID && photoCID) {
      return {
        videoCID,
        photoCID,
        videoURL: videoURL || `https://${videoCID}.ipfs.w3s.link`,
        photoURL: photoURL || `https://${photoCID}.ipfs.w3s.link`
      };
    }
    return undefined;
  }

  // Extract verification info from logs
  private extractVerificationFromLogs(logs: any[]): any {
    const scoreStr = this.extractLogValue(logs, 'Verification Score:');
    if (scoreStr) {
      const score = parseFloat(scoreStr) * 100; // Convert to percentage
      return {
        score: Math.round(score),
        confidence: parseFloat(scoreStr)
      };
    }
    return undefined;
  }

  // Extract recipient info from logs
  private extractRecipientFromLogs(logs: any[]): any {
    const recipient = this.extractLogValue(logs, 'Recipient:');
    const rewardStr = this.extractLogValue(logs, 'Token Reward:');
    
    if (recipient) {
      return {
        address: recipient,
        amount: rewardStr ? parseFloat(rewardStr) : 0
      };
    }
    return undefined;
  }

  // Helper to extract values from log patterns
  private extractLogValue(logs: any[], pattern: string): string | undefined {
    for (const log of logs) {
      const logString = JSON.stringify(log);
      const index = logString.indexOf(pattern);
      if (index !== -1) {
        // Extract the value after the pattern
        const start = index + pattern.length;
        const end = logString.indexOf('"', start + 1);
        if (end !== -1) {
          return logString.substring(start, end).trim();
        }
      }
    }
    return undefined;
  }

  // Convert Flow transaction status to readable string
  private getStatusString(status: number): string {
    switch (status) {
      case 0: return 'Unknown';
      case 1: return 'Pending';
      case 2: return 'Finalized';
      case 3: return 'Executed';
      case 4: return 'Sealed';
      case 5: return 'Expired';
      default: return `Status ${status}`;
    }
  }

  // Get aggregate stats from on-chain data
  async getOnChainStats(transactionIds: string[]) {
    const transactions = await this.getMultipleTransactions(transactionIds);
    
    const totalTokens = transactions.reduce((sum, tx) => sum + (tx.recipient?.amount || 0), 0);
    const averageScore = transactions.length > 0
      ? transactions.reduce((sum, tx) => sum + (tx.verification?.score || 0), 0) / transactions.length
      : 0;
    const uniqueAddresses = new Set(transactions.map(tx => tx.recipient?.address).filter(Boolean)).size;

    return {
      totalTransactions: transactions.length,
      totalTokensDistributed: totalTokens,
      averageVerificationScore: Math.round(averageScore),
      uniqueVerifiedHumans: uniqueAddresses,
      successfulTransactions: transactions.filter(tx => tx.status === 'Sealed').length,
      dataSource: 'Flow Blockchain (100% on-chain)',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const onChainDataService = new OnChainDataService();