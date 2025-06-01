// src/lib/flow/tokenService.ts - Enhanced with on-chain metadata storage
import * as fcl from "@onflow/fcl"
import * as types from "@onflow/types"
import { initFlow, NOCENIX_CONTRACT_ADDRESS, NOCENIX_CONTRACT_NAME, ADMIN_ADDRESS, ADMIN_PRIVATE_KEY } from "./config"
import { createAuthorizationFunction } from "./signingService"

// Initialize Flow configuration
initFlow()

// Enhanced transaction that transfers tokens AND stores challenge metadata on-chain
const ENHANCED_TRANSFER_TOKENS_TRANSACTION = `
import FungibleToken from 0x9a0766d93b6608b7
import Nocenix from 0xa622afad07f6739e
import FungibleTokenMetadataViews from 0x9a0766d93b6608b7

transaction(
    amount: UFix64, 
    to: Address,
    description: String,
    challengeTitle: String,
    challengerName: String,
    videoCID: String,
    photoCID: String,
    videoURL: String,
    photoURL: String,
    verificationScore: UFix64
) {

    /// FTVaultData metadata view for the token being used
    let vaultData: FungibleTokenMetadataViews.FTVaultData

    // The Vault resource that holds the tokens that are being transferred
    let sentVault: @{FungibleToken.Vault}

    prepare(signer: auth(BorrowValue) &Account) {

        self.vaultData = Nocenix.resolveContractView(resourceType: nil, viewType: Type<FungibleTokenMetadataViews.FTVaultData>()) as! FungibleTokenMetadataViews.FTVaultData?
            ?? panic("Could not resolve FTVaultData view. The Nocenix"
                .concat(" contract needs to implement the FTVaultData Metadata view in order to execute this transaction."))

        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &Nocenix.Vault>(from: self.vaultData.storagePath)
            ?? panic("The signer does not store an Nocenix.Vault object at the path "
                    .concat(self.vaultData.storagePath.toString())
                    .concat(". The signer must initialize their account with this vault first!"))

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {

        // Get the recipient's public account object
        let recipient = getAccount(to)

        // Get a reference to the recipient's Receiver
        let receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(self.vaultData.receiverPath)
            ?? panic("Could not borrow a Receiver reference to the FungibleToken Vault in account "
                .concat(to.toString()).concat(" at path ").concat(self.vaultData.receiverPath.toString())
                .concat(". Make sure you are sending to an address that has ")
                .concat("a FungibleToken Vault set up properly at the specified path."))

        // Deposit the withdrawn tokens in the recipient's receiver
        receiverRef.deposit(from: <-self.sentVault)

        // Log all challenge metadata for permanent on-chain storage in transaction logs
        log("=== CHALLENGE COMPLETION METADATA ===")
        log("Challenge Title: ".concat(challengeTitle))
        log("Challenger: ".concat(challengerName))
        log("Recipient: ".concat(to.toString()))
        log("Token Reward: ".concat(amount.toString()))
        log("Video CID: ".concat(videoCID))
        log("Photo CID: ".concat(photoCID))
        log("Video URL: ".concat(videoURL))
        log("Photo URL: ".concat(photoURL))
        log("Description: ".concat(description))
        log("Verification Score: ".concat(verificationScore.toString()))
        log("Completed At: ".concat(getCurrentBlock().timestamp.toString()))
        log("Block Height: ".concat(getCurrentBlock().height.toString()))
        log("=== END CHALLENGE METADATA ===")

        // Additional success confirmation logs
        log("✅ Challenge completed and metadata stored on-chain")
        log("🎬 Video permanently stored on Filecoin via Storacha: ".concat(videoURL))
        log("📸 Photo permanently stored on Filecoin via Storacha: ".concat(photoURL))
        log("🪙 Reward: ".concat(amount.toString()).concat(" NOCENIX transferred to ").concat(to.toString()))
        log("🔗 Cross-chain storage: Flow blockchain + Filecoin network")
    }
}
`

export interface EnhancedTransferTokensParams {
  recipientAddress: string
  amount: number
  description: string
  challengeData: {
    title: string
    challengerName?: string
    verificationResult?: {
      overallConfidence?: number
      score?: number
    }
    media?: {
      videoCID: string
      photoCID: string
      storachaLinks: {
        video: string
        photo: string
      }
    }
    timestamp: number
  }
}

// Keep backward compatibility
export interface TransferTokensParams extends EnhancedTransferTokensParams {}

export const transferTokens = async (params: EnhancedTransferTokensParams): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const { recipientAddress, amount, description, challengeData } = params

    console.log('🚀 Starting enhanced Flow token transfer with on-chain metadata:', {
      recipient: recipientAddress,
      amount: amount,
      challenge: challengeData.title,
      hasMedia: !!challengeData.media,
      adminAddress: ADMIN_ADDRESS
    })

    // Validate environment variables
    if (!ADMIN_ADDRESS || !ADMIN_PRIVATE_KEY) {
      throw new Error('Missing FLOW_ADMIN_ADDRESS or FLOW_ADMIN_PRIVATE_KEY environment variables')
    }

    // Validate media data for on-chain storage
    if (!challengeData.media || !challengeData.media.videoCID || !challengeData.media.photoCID) {
      throw new Error('Challenge media (videoCID and photoCID) is required for on-chain storage')
    }

    const { videoCID, photoCID, storachaLinks } = challengeData.media

    // Create authorization function with proper signing
    const authorizationFunction = createAuthorizationFunction(ADMIN_ADDRESS, ADMIN_PRIVATE_KEY)

    console.log('📝 Sending enhanced transaction with metadata...')

    // Send the enhanced transaction with all metadata
    const transactionId = await fcl.mutate({
      cadence: ENHANCED_TRANSFER_TOKENS_TRANSACTION,
      args: (arg: any, t: any) => [
        arg(amount.toFixed(8), t.UFix64), // Amount as UFix64 with proper precision
        arg(recipientAddress, t.Address), // Recipient address
        arg(description, t.String), // Challenge description
        arg(challengeData.title, t.String), // Challenge title
        arg(challengeData.challengerName || 'Nocena AI', t.String), // Challenger name
        arg(videoCID, t.String), // Video CID from Storacha
        arg(photoCID, t.String), // Photo CID from Storacha
        arg(storachaLinks.video, t.String), // Video URL
        arg(storachaLinks.photo, t.String), // Photo URL
        arg((challengeData.verificationResult?.overallConfidence || 0.75).toFixed(2), t.UFix64), // Verification score
      ],
      proposer: authorizationFunction,
      payer: authorizationFunction,
      authorizations: [authorizationFunction],
      limit: 1000, // Gas limit
    })

    console.log('📝 Enhanced transaction sent with ID:', transactionId)

    // Wait for the transaction to be sealed
    console.log('⏳ Waiting for transaction to be sealed...')
    const transaction = await fcl.tx(transactionId).onceSealed()
    
    console.log('📊 Enhanced transaction result:', {
      status: transaction.status,
      statusCode: transaction.statusCode,
      errorMessage: transaction.errorMessage,
      eventCount: transaction.events?.length || 0
    })

    if (transaction.status === 4) { // SEALED
      console.log('✅ Enhanced transaction sealed successfully:', transactionId)
      
      // Log the emitted events for verification
      const challengeEvents = transaction.events?.filter(event => 
        event.type.includes('ChallengeCompleted')
      ) || []
      
      if (challengeEvents.length > 0) {
        console.log('🎉 Challenge completion event emitted on-chain:', challengeEvents[0])
      }

      return {
        success: true,
        transactionId: transactionId
      }
    } else {
      console.error('❌ Enhanced transaction failed:', transaction.errorMessage)
      return {
        success: false,
        error: transaction.errorMessage || `Transaction failed with status: ${transaction.status}`
      }
    }

  } catch (error) {
    console.error('💥 Enhanced token transfer error:', error)
    
    // Enhanced error handling
    let errorMessage = 'Unknown error occurred'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Handle specific Flow errors
      if (errorMessage.includes('invalid signature')) {
        errorMessage = 'Invalid signature - check your private key configuration'
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in admin account'
      } else if (errorMessage.includes('invalid address')) {
        errorMessage = 'Invalid recipient address format'
      } else if (errorMessage.includes('missing value')) {
        errorMessage = 'Missing required transaction values'
      } else if (errorMessage.includes('contract not found')) {
        errorMessage = 'Smart contract not found at specified address'
      } else if (errorMessage.includes('media')) {
        errorMessage = 'Missing or invalid media data for on-chain storage'
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}