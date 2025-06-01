import FungibleToken from 0x9a0766d93b6608b7
import Nocenix from 0xa622afad07f6739e

transaction(amount: UFix64, to: Address) {
    let tokenAdmin: &Nocenix.Administrator
    let tokenReceiver: &{FungibleToken.Receiver}

    prepare(signer: AuthAccount) {
        self.tokenAdmin = signer.borrow<&Nocenix.Administrator>(from: Nocenix.AdminStoragePath)
            ?? panic("Signer is not the token admin")
        
        self.tokenReceiver = getAccount(to).getCapability(Nocenix.ReceiverPublicPath)
            .borrow<&{FungibleToken.Receiver}>()
            ?? panic("Unable to borrow receiver reference")
    }

    execute {
        let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
        let mintedVault <- minter.mintTokens(amount: amount)
        
        self.tokenReceiver.deposit(from: <-mintedVault)
        destroy minter
    }
}