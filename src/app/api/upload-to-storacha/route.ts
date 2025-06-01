// src/app/api/upload-to-storacha/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { create } from '@web3-storage/w3up-client';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Storacha upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Initialize Storacha client
    console.log('🔧 Initializing Storacha client...');
    const client = await create();
    
    // Login with your email
    const email = process.env.STORACHA_EMAIL as `${string}@${string}`;
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format in STORACHA_EMAIL environment variable');
    }
    
    console.log('🔐 Attempting login with email:', email);
    await client.login(email);
    console.log('✅ Login successful');
    
    // Set the current space to upload to
    const spaceDID = process.env.STORACHA_SPACE_DID as `did:${string}:${string}`;
    if (!spaceDID || !spaceDID.startsWith('did:')) {
      throw new Error('Invalid DID format in STORACHA_SPACE_DID environment variable');
    }
    
    console.log('🌌 Setting current space:', spaceDID);
    await client.setCurrentSpace(spaceDID);
    console.log('✅ Space set successfully');

    // Upload the file
    console.log('🚀 Starting upload to Storacha...');
    const cid = await client.uploadFile(file);
    
    console.log('✅ Storacha upload successful:', cid.toString());

    return NextResponse.json({
      success: true,
      cid: cid.toString(),
      url: `https://${cid}.ipfs.w3s.link`,
      size: file.size,
      filename: file.name
    });

  } catch (error) {
    console.error('💥 Storacha upload error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}