// src/lib/flow/tokenService.ts
import * as fcl from "@onflow/fcl"
import * as types from "@onflow/types"
import { initFlow, NOCENIX_CONTRACT_ADDRESS, NOCENIX_CONTRACT_NAME, ADMIN_ADDRESS, ADMIN_PRIVATE_KEY } from "./config"
import { createAuthorizationFunction } from "./signingService"

// Initialize Flow configuration
initFlow()

// Transaction to transfer tokens - updated with correct addresses
const TRANSFER_TOKENS_TRANSACTION = `
import FungibleToken from 0x9a0766d93b6608b7
import Nocenix from 0xa622afad07f6739e
import FungibleTokenMetadataViews from 0x9a0766d93b6608b7

transaction(amount: UFix64, to: Address) {

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
    }
}
`

export interface TransferTokensParams {
  recipientAddress: string
  amount: number
  description: string
  challengeData: {
    title: string
    verificationResult: any
    timestamp: number
  }
}

export const transferTokens = async (params: TransferTokensParams): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const { recipientAddress, amount } = params

    console.log('🚀 Starting Flow token transfer via SDK:', {
      recipient: recipientAddress,
      amount: amount,
      adminAddress: ADMIN_ADDRESS
    })

    // Validate environment variables
    if (!ADMIN_ADDRESS || !ADMIN_PRIVATE_KEY) {
      throw new Error('Missing FLOW_ADMIN_ADDRESS or FLOW_ADMIN_PRIVATE_KEY environment variables')
    }

    // Create authorization function with proper signing
    const authorizationFunction = createAuthorizationFunction(ADMIN_ADDRESS, ADMIN_PRIVATE_KEY)

    console.log('📝 Sending transaction...')

    // Send the transaction
    const transactionId = await fcl.mutate({
      cadence: TRANSFER_TOKENS_TRANSACTION,
      args: (arg: any, t: any) => [
        arg(amount.toFixed(8), t.UFix64), // Amount as UFix64 with proper precision
        arg(recipientAddress, t.Address), // Recipient address
      ],
      proposer: authorizationFunction,
      payer: authorizationFunction,
      authorizations: [authorizationFunction],
      limit: 1000, // Gas limit
    })

    console.log('📝 Transaction sent with ID:', transactionId)

    // Wait for the transaction to be sealed
    console.log('⏳ Waiting for transaction to be sealed...')
    const transaction = await fcl.tx(transactionId).onceSealed()
    
    console.log('📊 Transaction result:', {
      status: transaction.status,
      statusCode: transaction.statusCode,
      errorMessage: transaction.errorMessage
    })

    if (transaction.status === 4) { // SEALED
      console.log('✅ Transaction sealed successfully:', transactionId)
      return {
        success: true,
        transactionId: transactionId
      }
    } else {
      console.error('❌ Transaction failed:', transaction.errorMessage)
      return {
        success: false,
        error: transaction.errorMessage || `Transaction failed with status: ${transaction.status}`
      }
    }

  } catch (error) {
    console.error('💥 Token transfer error:', error)
    
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
      }
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}