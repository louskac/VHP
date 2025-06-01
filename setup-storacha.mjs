// setup-storacha.mjs
import { create } from '@web3-storage/w3up-client';

async function setup() {
  try {
    console.log('🔧 Setting up Storacha authentication...');
    
    const client = await create();
    console.log('🤖 Client created successfully');
    
    // Login with your email - should work now since email is validated
    console.log('🔐 Attempting login...');
    await client.login('lustykjakub@gmail.com');
    console.log('✅ Login successful');
    
    // List available spaces
    console.log('📁 Listing spaces...');
    const spaces = Array.from(client.spaces());
    console.log(`Found ${spaces.length} spaces:`);
    
    for (const space of spaces) {
      console.log('  Space DID:', space.did());
    }
    
    // Try to use the space from your dashboard first
    const targetSpaceDID = 'did:key:z6Mkh3hzDsM9qrCf5oLsYU1PGixNBrUfSZrdNfU3iwdYL21r';
    console.log('🌌 Attempting to set space:', targetSpaceDID);
    
    try {
      await client.setCurrentSpace(targetSpaceDID);
      console.log('✅ Space set successfully to dashboard space');
    } catch (spaceError) {
      console.log('⚠️ Dashboard space not accessible, trying first available space...');
      if (spaces.length > 0) {
        const firstSpace = spaces[0].did();
        console.log('🌌 Setting space to:', firstSpace);
        await client.setCurrentSpace(firstSpace);
        console.log('✅ Space set successfully to:', firstSpace);
        console.log('📝 Update your .env file with this space DID:');
        console.log(`STORACHA_SPACE_DID=${firstSpace}`);
      } else {
        throw new Error('No spaces available');
      }
    }
    
    console.log('🎉 Setup complete! Your client is now authorized.');
    console.log('🔧 You can now run your app and uploads should work.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('🔍 Full error:', error);
  }
}

setup();