// src/lib/chaingpt.ts
const { Nft } = require('@chaingpt/nft');

interface NFTGenerationOptions {
  walletAddress: string;
  prompt: string;
  model: 'velogen' | 'nebula_forge_xl' | 'VisionaryForge' | 'Dale3';
  chainId?: number; // Default to Polygon (137)
  steps?: number;
  height?: number;
  width?: number;
  enhance?: 'original' | '1x' | '2x';
}

interface GeneratedNFT {
  collectionId: string;
  status: string;
  images?: string[];
  metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: any[];
  };
}

class ChainGPTNFTService {
  private nftInstance: any;

  constructor() {
    this.nftInstance = new Nft({
      apiKey: process.env.CHAINGPT_API_KEY,
    });
  }

  // Generate NFT with queue (recommended for production)
  async generateChallengeNFT(options: NFTGenerationOptions): Promise<string> {
    try {
      const result = await this.nftInstance.generateNftWithQueue({
        walletAddress: options.walletAddress,
        prompt: options.prompt,
        model: options.model || 'velogen',
        chainId: options.chainId || 137, // Polygon
        steps: options.steps || 20,
        height: options.height || 512,
        width: options.width || 512,
        enhance: options.enhance || 'original',
        amount: 1, // Single NFT
      });

      return result.collectionId;
    } catch (error) {
      console.error('ChainGPT NFT generation error:', error);
      throw error;
    }
  }

  // Check progress of NFT generation
  async checkNFTProgress(collectionId: string): Promise<any> {
    try {
      const progress = await this.nftInstance.getNftProgress({
        collectionId: collectionId,
      });
      return progress;
    } catch (error) {
      console.error('Error checking NFT progress:', error);
      throw error;
    }
  }

  // Mint the generated NFT
  async mintNFT(collectionId: string, name: string, description: string, symbol: string = 'NOCENA'): Promise<any> {
    try {
      const mintResult = await this.nftInstance.mintNft({
        collectionId: collectionId,
        name: name,
        description: description,
        symbol: symbol,
        ids: [1], // Array of token IDs
      });
      return mintResult;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  // Get contract ABI (if needed for direct blockchain interaction)
  async getContractABI(): Promise<any> {
    try {
      const abi = await this.nftInstance.abi();
      return abi;
    } catch (error) {
      console.error('Error getting ABI:', error);
      throw error;
    }
  }
}

export const chainGPTService = new ChainGPTNFTService();