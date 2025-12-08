import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { privateKeyToAccount } from 'viem/accounts';

// Server-side signing for validation requests
export async function POST(req: NextRequest) {
  try {
    const { originalData, validatorId, serverId } = await req.json();

    if (!originalData || !validatorId || !serverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Re-calculate dataHash server-side for verification
    const serverDataHash = createHash('sha256')
      .update(originalData)
      .digest('hex');
    const dataHash = `0x${serverDataHash}`;

    // Get signer private key from environment
    const signerKey = process.env.SIGNER_KEY;
    if (!signerKey) {
      console.error('SIGNER_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create account from private key
    const account = privateKeyToAccount(signerKey as `0x${string}`);
    
    // Sign the dataHash with account method
    const signature = await account.signMessage({
      message: { raw: dataHash as `0x${string}` }
    });

    console.log('Validation request processed:', {
      validatorId,
      serverId,
      dataHash,
      signature: signature.substring(0, 10) + '...',
      signerAddress: account.address,
      originalDataLength: originalData.length
    });

    return NextResponse.json({
      success: true,
      dataHash,
      signature,
      signerAddress: account.address,
      validatorId,
      serverId,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Validation request API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}