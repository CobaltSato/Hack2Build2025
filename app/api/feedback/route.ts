import { NextRequest } from "next/server";
import { settlePayment, facilitator } from "thirdweb/x402";
import { avalancheFuji } from "thirdweb/chains";
import { createThirdwebClient } from "thirdweb";
import { USDC_FUJI_ADDRESS, PAYMENT_AMOUNTS } from "@/lib/constants";

const client = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: process.env.THIRDWEB_SERVER_WALLET_ADDRESS!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body early so we can validate before charging the user
    const body = await request.json();
    const { clientId, serverId, score, comment, timestamp } = body;

    // Validate input
    if (!clientId || !serverId || score === undefined || !comment) {
      return Response.json(
        { error: "Missing required feedback data" },
        { status: 400 }
      );
    }

    if (score < 0 || score > 100) {
      return Response.json(
        { error: "Score must be between 0 and 100" },
        { status: 400 }
      );
    }

    const paymentData = request.headers.get("x-payment");
    const resourceUrl = request.url;

    // Settle the payment
    const result = await settlePayment({
      resourceUrl,
      method: "POST",
      paymentData,
      payTo: process.env.MERCHANT_WALLET_ADDRESS! as `0x${string}`,
      network: avalancheFuji,
      price: {
        amount: PAYMENT_AMOUNTS.FEEDBACK.amount,
        asset: {
          address: USDC_FUJI_ADDRESS,
        },
      },
      facilitator: thirdwebFacilitator,
    });

    if (result.status !== 200) {
      return Response.json(result.responseBody, {
        status: result.status,
        headers: result.responseHeaders,
      });
    }

    // Mock feedback submission to ERC-8004 contract
    // In a real implementation, this would call the actual smart contract
    console.log("Feedback submission:", {
      clientId,
      serverId,
      score,
      comment,
      timestamp,
      paymentSettled: true,
    });

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock transaction hash (would be real transaction hash from contract interaction)
    const mockTxHash = "0x" + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

    return Response.json({
      success: true,
      message: "Feedback submitted successfully",
      data: {
        feedbackId: Date.now().toString(),
        clientId,
        serverId,
        score,
        txHash: mockTxHash,
        timestamp,
        paymentAmount: PAYMENT_AMOUNTS.FEEDBACK.amount,
        paymentCurrency: "USDC",
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Feedback submission error:", error);
    
    return Response.json(
      { 
        error: "Internal server error during feedback submission",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    service: "ERC-8004 Feedback Submission",
    price: `$${parseFloat(PAYMENT_AMOUNTS.FEEDBACK.amount) / 1000000} USDC`,
    description: "Submit verified feedback with USDC payment",
    requirements: ["Valid client and server IDs", "Score between 0-100", "Comment text"],
  });
}
