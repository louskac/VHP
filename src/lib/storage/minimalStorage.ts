// src/lib/storage/minimalStorage.ts
import fs from 'fs';
import path from 'path';

export interface TransactionRecord {
  id: string;
  transactionId: string;
  timestamp: string;
  // That's it! Everything else comes from on-chain
}

class MinimalStorage {
  private readonly dataDir: string;
  private readonly dataFile: string;

  constructor() {
    // Store in public directory so it's accessible and persists
    this.dataDir = path.join(process.cwd(), 'public', 'data');
    this.dataFile = path.join(this.dataDir, 'vhp-transactions.json');
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      
      // Create empty file if it doesn't exist
      if (!fs.existsSync(this.dataFile)) {
        fs.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error ensuring data directory:', error);
    }
  }

  // Save only the transaction ID
  async saveTransaction(transactionId: string): Promise<TransactionRecord> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    const record: TransactionRecord = {
      id,
      transactionId,
      timestamp
    };

    try {
      const existing = await this.getAllTransactions();
      existing.push(record);
      
      // Write to file with pretty formatting
      await fs.promises.writeFile(
        this.dataFile, 
        JSON.stringify(existing, null, 2),
        'utf8'
      );

      console.log('💾 Saved transaction ID to minimal storage:', {
        id,
        transactionId,
        file: this.dataFile
      });

      return record;
    } catch (error) {
      console.error('Error saving transaction record:', error);
      throw error;
    }
  }

  // Get all transaction IDs
  async getAllTransactions(): Promise<TransactionRecord[]> {
    try {
      const data = await fs.promises.readFile(this.dataFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading transaction records:', error);
      return [];
    }
  }

  // Get recent transaction IDs (last N)
  async getRecentTransactions(limit: number = 10): Promise<TransactionRecord[]> {
    const all = await this.getAllTransactions();
    return all
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Get basic stats
  async getStats() {
    const transactions = await this.getAllTransactions();
    
    return {
      totalTransactions: transactions.length,
      lastUpdated: new Date().toISOString(),
      dataFile: '/data/vhp-transactions.json', // Public URL
      note: 'All challenge data fetched from Flow blockchain using transaction IDs'
    };
  }

  // Get file info
  async getFileInfo() {
    try {
      const stats = await fs.promises.stat(this.dataFile);
      return {
        size: this.formatBytes(stats.size),
        lastModified: stats.mtime.toISOString(),
        path: this.dataFile,
        publicUrl: '/data/vhp-transactions.json'
      };
    } catch (error) {
      return {
        size: '0 B',
        lastModified: new Date().toISOString(),
        path: this.dataFile,
        publicUrl: '/data/vhp-transactions.json'
      };
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const minimalStorage = new MinimalStorage();