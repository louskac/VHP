// src/lib/storage/minimalStorage.ts
export interface TransactionRecord {
  id: string;
  transactionId: string;
  timestamp: string;
}

class MinimalStorage {
  private readonly MAX_RECORDS = 3;

  async saveTransaction(transactionId: string): Promise<TransactionRecord> {
    const recordId = this.generateId();
    const timestamp = new Date().toISOString();
    
    const record: TransactionRecord = {
      id: recordId,
      transactionId,
      timestamp
    };

    try {
      // First, clean up old records to maintain only 3
      await this.cleanupOldRecords();

      // Add new transaction record using the exact schema
      const mutation = `
        mutation AddTransactionRecord($input: [AddTransactionRecordInput!]!) {
          addTransactionRecord(input: $input) {
            transactionRecord {
              recordId
              transactionId
              timestamp
            }
          }
        }
      `;

      const variables = {
        input: [{
          recordId: recordId,
          transactionId: transactionId,
          timestamp: timestamp
        }]
      };

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DG-Auth': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
        },
        body: JSON.stringify({ 
          query: mutation,
          variables: variables
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Dgraph mutation errors:', result.errors);
        throw new Error(`Dgraph mutation error: ${JSON.stringify(result.errors)}`);
      }

      console.log('💾 Saved transaction to Dgraph:', { 
        recordId, 
        transactionId,
        timestamp 
      });

      return record;
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  async getAllTransactions(): Promise<TransactionRecord[]> {
    try {
      const query = `
        query GetAllTransactionRecords {
          queryTransactionRecord(order: { desc: timestamp }) {
            recordId
            transactionId
            timestamp
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DG-Auth': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Dgraph query errors:', result.errors);
        return [];
      }

      const records = result.data?.queryTransactionRecord || [];
      
      // Convert to our interface format
      return records.map((record: any) => ({
        id: record.recordId,
        transactionId: record.transactionId,
        timestamp: record.timestamp,
      }));
    } catch (error) {
      console.error('Error loading transactions from Dgraph:', error);
      return [];
    }
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionRecord[]> {
    try {
      const query = `
        query GetRecentTransactionRecords($first: Int!) {
          queryTransactionRecord(order: { desc: timestamp }, first: $first) {
            recordId
            transactionId
            timestamp
          }
        }
      `;

      const variables = { first: limit };

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DG-Auth': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
        },
        body: JSON.stringify({ 
          query,
          variables 
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Dgraph query errors:', result.errors);
        return [];
      }

      const records = result.data?.queryTransactionRecord || [];
      
      return records.map((record: any) => ({
        id: record.recordId,
        transactionId: record.transactionId,
        timestamp: record.timestamp,
      }));
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      return [];
    }
  }

  async getStats() {
    const transactions = await this.getAllTransactions();
    
    return {
      totalTransactions: transactions.length,
      maxRecords: this.MAX_RECORDS,
      lastUpdated: new Date().toISOString(),
      storage: 'Dgraph',
      endpoint: process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT,
      note: 'Transaction storage using Dgraph TransactionRecord schema'
    };
  }

  // Clean up old records, keeping only the last 3
  private async cleanupOldRecords(): Promise<void> {
    try {
      const allRecords = await this.getAllTransactions();
      
      if (allRecords.length >= this.MAX_RECORDS) {
        // Get records to delete (all except the last 2, since we're adding 1 more)
        const recordsToDelete = allRecords.slice(this.MAX_RECORDS - 1);
        
        for (const record of recordsToDelete) {
          await this.deleteTransactionRecord(record.id);
        }

        console.log(`🗑️ Cleaned up ${recordsToDelete.length} old transaction records`);
      }
    } catch (error) {
      console.error('Error cleaning up old records:', error);
    }
  }

  private async deleteTransactionRecord(recordId: string): Promise<void> {
    try {
      const deleteMutation = `
        mutation DeleteTransactionRecord($filter: TransactionRecordFilter!) {
          deleteTransactionRecord(filter: $filter) {
            msg
          }
        }
      `;

      const variables = {
        filter: {
          recordId: { eq: recordId }
        }
      };

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DG-Auth': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
        },
        body: JSON.stringify({
          query: deleteMutation,
          variables: variables
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Error deleting transaction record:', result.errors);
      }
    } catch (error) {
      console.error('Error in deleteTransactionRecord:', error);
    }
  }

  // Clear all records (for testing)
  async clearAll(): Promise<void> {
    try {
      const clearMutation = `
        mutation ClearAllTransactionRecords {
          deleteTransactionRecord(filter: {}) {
            msg
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_DGRAPH_ENDPOINT!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DG-Auth': process.env.NEXT_PUBLIC_DGRAPH_API_KEY!,
        },
        body: JSON.stringify({ query: clearMutation }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Error clearing records:', result.errors);
      } else {
        console.log('🗑️ Cleared all transaction records from Dgraph');
      }
    } catch (error) {
      console.error('Error clearing all records:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
}

// Export singleton instance
export const minimalStorage = new MinimalStorage();