// src/lib/flow/config.ts
import * as fcl from "@onflow/fcl"

// Flow testnet configuration
export const initFlow = () => {
  fcl.config({
    "accessNode.api": "https://rest-testnet.onflow.org", // Testnet REST API
    "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn", // Testnet wallet discovery
    "0xProfile": "0xba1132bc08f82fe2", // Profile contract address on testnet
    "0xFlowToken": "0x7e60df042a9c0868", // FlowToken contract address on testnet
    "app.detail.title": "Nocena",
    "app.detail.icon": "https://nocena.com/logo.png" // Replace with your actual logo URL
  })
}

// Your deployed contract details from flow.json
export const NOCENIX_CONTRACT_ADDRESS = "0xa622afad07f6739e"
export const NOCENIX_CONTRACT_NAME = "Nocenix"

// Environment variables for your admin account
export const ADMIN_ADDRESS = process.env.FLOW_ADMIN_ADDRESS || "0xa622afad07f6739e"
export const ADMIN_PRIVATE_KEY = process.env.FLOW_ADMIN_PRIVATE_KEY || ""

// Validate configuration
if (typeof window === 'undefined') { // Only run on server side
  if (!ADMIN_ADDRESS || !ADMIN_PRIVATE_KEY) {
    console.warn('⚠️ Warning: Flow admin credentials not configured. Please set FLOW_ADMIN_ADDRESS and FLOW_ADMIN_PRIVATE_KEY environment variables.')
  }
}