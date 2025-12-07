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

interface EvaluationRecord {
  agentId: number;
  agentName: string;
  overallScore: number;
  totalEvaluations: number;
  categories: Record<
    string,
    {
      score: number;
      count: number;
      trend: string;
    }
  >;
  recentFeedback: Array<{
    id: string;
    score: number;
    comment: string;
    category: string;
    timestamp: string;
    verified: boolean;
  }>;
  validationHistory: Array<{
    id: string;
    validatorName: string;
    score: number;
    dataType: string;
    timestamp: string;
    reward: string;
  }>;
  performanceMetrics: {
    uptime: string;
    avgResponseTime: string;
    successRate: string;
    userSatisfaction: string;
  };
}

// Mock detailed evaluation data
const DETAILED_EVALUATIONS: Record<string, EvaluationRecord> = {
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

const DEFAULT_CATEGORY_NAMES = [
  "Accuracy",
  "Response Time",
  "Helpfulness",
  "User Experience",
] as const;

const DEFAULT_FEEDBACK_TEMPLATES = [
  {
    category: "Accuracy",
    comment: "Produces precise results with minimal supervision.",
  },
  {
    category: "Response Time",
    comment: "Handles bursts of traffic with steady response times.",
  },
  {
    category: "Helpfulness",
    comment: "Explains reasoning clearly and offers actionable next steps.",
  },
  {
    category: "User Experience",
    comment: "Delivers a polished conversational experience for end users.",
  },
];

const DEFAULT_VALIDATION_TEMPLATES = [
  {
    validator: "Community Auditor",
    dataType: "Domain-specific evaluation",
    reward: "0.006 AVAX",
  },
  {
    validator: "Reliability Oracle",
    dataType: "Uptime verification",
    reward: "0.004 AVAX",
  },
];

const HOUR_IN_MS = 60 * 60 * 1000;

const toSeed = (agentId: string | number): number => {
  if (typeof agentId === "number" && Number.isFinite(agentId)) {
    return agentId;
  }
  const numeric = Number(agentId);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }
  if (typeof agentId === "string") {
    return agentId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  return 0;
};

const createDefaultEvaluationData = (
  agentId: string | number,
  providedAgentName?: string,
): EvaluationRecord => {
  const seed = toSeed(agentId) || 1;
  const numericAgentId = Number.isFinite(Number(agentId))
    ? Number(agentId)
    : seed;
  const fallbackName = providedAgentName?.trim() && providedAgentName.trim().length > 0
    ? providedAgentName.trim()
    : `Agent #${String(agentId)}`;

  const randomInRange = (offset: number, min: number, max: number) => {
    const x = Math.sin(seed * 9301 + offset * 49297) * 233280;
    const normalized = x - Math.floor(x);
    return min + normalized * (max - min);
  };

  const categories = DEFAULT_CATEGORY_NAMES.reduce<EvaluationRecord["categories"]>((acc, name, index) => {
    const score = Math.round(randomInRange(index + 1, 78, 97));
    const count = Math.round(randomInRange(index + 11, 8, 28));
    const trendValue = randomInRange(index + 21, -2.5, 4.5);
    acc[name] = {
      score,
      count,
      trend: `${trendValue >= 0 ? "+" : ""}${trendValue.toFixed(1)}%`,
    };
    return acc;
  }, {} as EvaluationRecord["categories"]);

  const recentFeedback: EvaluationRecord["recentFeedback"] = DEFAULT_FEEDBACK_TEMPLATES.map(
    (template, index) => ({
      id: `fb-${agentId}-${index}`,
      score: Math.round(randomInRange(index + 31, 80, 100)),
      comment: template.comment.replace("{agent}", fallbackName),
      category: template.category,
      timestamp: new Date(
        Date.now() - Math.round(randomInRange(index + 41, 3, 36)) * HOUR_IN_MS,
      ).toISOString(),
      verified: randomInRange(index + 51, 0, 1) > 0.35,
    }),
  );

  const validationHistory: EvaluationRecord["validationHistory"] = DEFAULT_VALIDATION_TEMPLATES.map(
    (template, index) => ({
      id: `val-${agentId}-${index}`,
      validatorName: template.validator,
      score: Math.round(randomInRange(index + 61, 82, 98)),
      dataType: template.dataType,
      timestamp: new Date(
        Date.now() - Math.round(randomInRange(index + 71, 48, 120)) * HOUR_IN_MS,
      ).toISOString(),
      reward: template.reward,
    }),
  );

  const performanceMetrics: EvaluationRecord["performanceMetrics"] = {
    uptime: `${randomInRange(101, 97.1, 99.9).toFixed(1)}%`,
    avgResponseTime: `${randomInRange(111, 0.9, 2.4).toFixed(2)}s`,
    successRate: `${randomInRange(121, 93.0, 99.4).toFixed(1)}%`,
    userSatisfaction: `${randomInRange(131, 4.1, 4.9).toFixed(1)}/5.0`,
  };

  return {
    agentId: numericAgentId,
    agentName: fallbackName,
    overallScore: Number(randomInRange(141, 82, 96).toFixed(1)),
    totalEvaluations: Math.round(randomInRange(151, 28, 120)),
    categories,
    recentFeedback,
    validationHistory,
    performanceMetrics,
  };
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body first so we can validate before charging the user
    const body = await request.json();
    const { agentId, agentName } = body;

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
    const evaluationData =
      DETAILED_EVALUATIONS[String(agentId)] ??
      createDefaultEvaluationData(agentId, agentName);

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
