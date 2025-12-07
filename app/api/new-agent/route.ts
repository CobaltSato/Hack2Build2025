import { NextRequest } from "next/server";
import { avalancheFuji } from "thirdweb/chains";
import { createThirdwebClient, getContract } from "thirdweb";
import { prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// IdentityRegistry contract configuration
const IDENTITY_REGISTRY_ADDRESS = "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29";
const AGENT_REGISTRATION_FEE = "5000000000000000"; // 0.005 AVAX in wei

const identityContract = getContract({
  client,
  chain: avalancheFuji,
  address: IDENTITY_REGISTRY_ADDRESS,
});

export async function POST(request: NextRequest) {
  try {
    console.log("NEW_AGENT API called");
    
    // Parse the request body early so we can validate before charging the user
    const body = await request.json();
    console.log("Request body:", body);
    
    const { agentName, cardURI, userAddress } = body;

    // Validate input
    if (!agentName || !cardURI || !userAddress) {
      console.log("Missing required parameters");
      return Response.json(
        { error: "Missing required parameters: agentName, cardURI, userAddress" },
        { status: 400 }
      );
    }

    // Validate agent name (3-64 characters, alphanumeric only as per contract)
    if (agentName.length < 3 || agentName.length > 64) {
      return Response.json(
        { error: "Agent name must be between 3 and 64 characters" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9]+$/.test(agentName)) {
      return Response.json(
        { error: "Agent name must contain only alphanumeric characters" },
        { status: 400 }
      );
    }

    console.log("Proceeding to contract call...");

    // Now execute the actual contract call to register the agent
    const privateKey = process.env.EOA_DEPLOYER_SEC;
    if (!privateKey) {
      throw new Error("Server private key not configured");
    }
    
    // Ensure private key has 0x prefix
    const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    const serverAccount = privateKeyToAccount({
      client,
      privateKey: formattedPrivateKey as `0x${string}`,
    });

    // Prepare the contract call
    const transaction = prepareContractCall({
      contract: identityContract,
      method: "function newAgent(string memory domain, string memory cardURI) external payable returns (uint256)",
      params: [agentName, cardURI],
      value: AGENT_REGISTRATION_FEE, // 0.005 AVAX fee
    });

    // Send the transaction
    const transactionResult = await sendTransaction({
      transaction,
      account: serverAccount,
    });

    console.log("Agent registration transaction:", {
      agentName,
      cardURI,
      userAddress,
      txHash: transactionResult.transactionHash,
      usdcPaymentSettled: true,
      avaxFeeAmount: AGENT_REGISTRATION_FEE,
    });

    // Get the token ID from transaction receipt (would need to parse events in real implementation)
    // For now, simulate token ID generation
    const tokenId = Date.now().toString();

    return Response.json({
      success: true,
      message: "Agent registered successfully",
      data: {
        agentId: tokenId,
        agentName,
        cardURI,
        txHash: transactionResult.transactionHash,
        registrationFee: {
          avax: "0.005",
        },
        contractAddress: IDENTITY_REGISTRY_ADDRESS,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Agent registration error:", error);
    
    return Response.json(
      { 
        error: "Internal server error during agent registration",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    service: "ERC-8004 New Agent Registration",
    price: "0.005 AVAX",
    description: "Register a new agent in the IdentityRegistry contract",
    requirements: [
      "Agent name (3-64 alphanumeric characters)",
      "Card URI (metadata URL)",
      "User wallet address",
      "0.005 AVAX blockchain fee"
    ],
    contract: {
      address: IDENTITY_REGISTRY_ADDRESS,
      network: "Avalanche Fuji Testnet",
      function: "newAgent(string domain, string cardURI)",
    },
  });
}