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

// Mock detailed evaluation data
const DETAILED_EVALUATIONS = {
  "1": {
    agentId: 1,
    agentName: "Study Helper AI",
    overallScore: 92.5,
    totalEvaluations: 47,
    categories: {
      "Accuracy": { score: 94, count: 15, trend: "+2.1%" },
      "Response Time": { score: 89, count: 12, trend: "-1.4%" },
      "Helpfulness": { score: 96, count: 20, trend: "+3.8%" },
      "User Experience": { score: 91, count: 18, trend: "+1.2%" }
    },
    recentFeedback: [
      {
        id: "fb-001",
        score: 95,
        comment: "Excellent explanations for complex math problems. Very helpful!",
        category: "Accuracy",
        timestamp: "2024-12-06T14:30:00Z",
        verified: true
      },
      {
        id: "fb-002", 
        score: 88,
        comment: "Good responses but sometimes a bit slow during peak hours.",
        category: "Response Time",
        timestamp: "2024-12-06T11:15:00Z",
        verified: true
      },
      {
        id: "fb-003",
        score: 97,
        comment: "Amazing at breaking down complex concepts into simple terms.",
        category: "Helpfulness", 
        timestamp: "2024-12-05T16:45:00Z",
        verified: true
      }
    ],
    validationHistory: [
      {
        id: "val-001",
        validatorName: "Math Teacher AI",
        score: 95,
        dataType: "Algebra Solutions",
        timestamp: "2024-12-05T09:30:00Z",
        reward: "0.008 AVAX"
      },
      {
        id: "val-002",
        validatorName: "Education Expert AI",
        score: 90,
        dataType: "Study Guide Creation",
        timestamp: "2024-12-04T15:20:00Z", 
        reward: "0.005 AVAX"
      }
    ],
    performanceMetrics: {
      uptime: "99.7%",
      avgResponseTime: "1.2s",
      successRate: "97.8%",
      userSatisfaction: "4.6/5.0"
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body first so we can validate before charging the user
    const body = await request.json();
    const { agentId } = body;

    // Validate input
    if (!agentId) {
      return Response.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const paymentData = request.headers.get("x-payment");

    // X402 requires the absolute URL of the protected resource
    const resourceUrl = request.url;

    // Settle the payment
    const result = await settlePayment({
      resourceUrl,
      method: "POST",
      paymentData,
      payTo: process.env.MERCHANT_WALLET_ADDRESS! as `0x${string}`,
      network: avalancheFuji,
      price: {
        amount: PAYMENT_AMOUNTS.EVALUATION_VIEW.amount,
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

    // Get detailed evaluation data
    const evaluationData = DETAILED_EVALUATIONS[agentId as keyof typeof DETAILED_EVALUATIONS];
    
    if (!evaluationData) {
      return Response.json(
        { error: "Evaluation data not found for this agent" },
        { status: 404 }
      );
    }

    // Log the access for analytics
    console.log("Detailed evaluation accessed:", {
      agentId,
      timestamp: new Date().toISOString(),
      paymentAmount: PAYMENT_AMOUNTS.EVALUATION_VIEW.amount,
    });

    return Response.json({
      success: true,
      data: evaluationData,
      accessGranted: true,
      paymentInfo: {
        amount: PAYMENT_AMOUNTS.EVALUATION_VIEW.amount,
        currency: "USDC",
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Evaluation view access error:", error);
    
    return Response.json(
      { 
        error: "Internal server error during evaluation access",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    service: "ERC-8004 Detailed Evaluation Access",
    price: `$${parseFloat(PAYMENT_AMOUNTS.EVALUATION_VIEW.amount) / 1000000} USDC`,
    description: "Access comprehensive evaluation details and analytics",
    features: [
      "Detailed performance metrics",
      "Category-wise feedback analysis", 
      "Recent evaluation history",
      "Validation records",
      "Trend analysis"
    ],
  });
}
