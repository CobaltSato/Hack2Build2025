"use client";

import { useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { useActiveWallet } from "thirdweb/react";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Lock, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Star,
  Clock,
  CheckCircle,
  BarChart3,
  Users,
  Zap,
  Shield,
  MessageCircle,
  Award,
  Activity
} from "lucide-react";
import { createNormalizedFetch } from "@/lib/payment";
import { AVALANCHE_FUJI_CHAIN_ID, PAYMENT_AMOUNTS, API_ENDPOINTS } from "@/lib/constants";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

interface DetailedEvaluationProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

interface EvaluationData {
  agentId: number;
  agentName: string;
  overallScore: number;
  totalEvaluations: number;
  categories: {
    [key: string]: {
      score: number;
      count: number;
      trend: string;
    };
  };
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

export function DetailedEvaluation({ agentId, agentName, onClose }: DetailedEvaluationProps) {
  const wallet = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayForAccess = async () => {
    if (!wallet) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Payment amounts:', PAYMENT_AMOUNTS);
      console.log('Evaluation view amount:', PAYMENT_AMOUNTS.EVALUATION_VIEW);
      
      const normalizedFetch = createNormalizedFetch(AVALANCHE_FUJI_CHAIN_ID);
      const fetchWithPay = wrapFetchWithPayment(
        normalizedFetch,
        client,
        wallet,
        PAYMENT_AMOUNTS.EVALUATION_VIEW?.bigInt || BigInt(100000) // Fallback: 0.10 USDC
      );

      const response = await fetchWithPay(API_ENDPOINTS.EVALUATION_VIEW, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId, agentName }),
      });

      if (response.ok) {
        const result = await response.json();
        setEvaluationData(result.data);
        setHasAccess(true);
      } else {
        const errorData = await response.json();
        setError(`Failed to access evaluation: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith("+")) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend.startsWith("-")) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  if (!hasAccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Premium Evaluation Access</span>
            </CardTitle>
            <CardDescription>
              Access detailed evaluation data for {agentName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Premium Features</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Detailed performance metrics</li>
                <li>• Category-wise feedback analysis</li>
                <li>• Recent evaluation history</li>
                <li>• Validation records & trends</li>
                <li>• Advanced analytics dashboard</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-900">Payment Required</span>
              </div>
              <p className="text-sm text-purple-700">
                <strong>$0.10 USDC</strong> for detailed evaluation access
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Processed via HTTP 402 protocol
              </p>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handlePayForAccess}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay $0.10 USDC
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evaluationData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="text-white">Loading evaluation data...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Detailed Evaluation: {evaluationData.agentName}</span>
              </CardTitle>
              <CardDescription>
                Comprehensive performance analysis and feedback data
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <CardContent className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{evaluationData.overallScore}</p>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{evaluationData.totalEvaluations}</p>
                      <p className="text-xs text-muted-foreground">Total Evaluations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{evaluationData.performanceMetrics.uptime}</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{evaluationData.performanceMetrics.avgResponseTime}</p>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Category Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(evaluationData.categories).map(([category, data]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{category}</h4>
                        <div className="flex items-center space-x-1">
                          {getTrendIcon(data.trend)}
                          <span className={`text-sm ${data.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {data.trend}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold">{data.score}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.count} evaluations
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${data.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Recent Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluationData.recentFeedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{feedback.category}</Badge>
                          <Badge variant="outline">Score: {feedback.score}/100</Badge>
                          {feedback.verified && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(feedback.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{feedback.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Validation History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Validation History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {evaluationData.validationHistory.map((validation) => (
                    <div key={validation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{validation.validatorName}</p>
                        <p className="text-sm text-muted-foreground">{validation.dataType}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(validation.timestamp)}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold">Score: {validation.score}/100</span>
                        </div>
                        <p className="text-sm text-green-600">Reward: {validation.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{evaluationData.performanceMetrics.uptime}</p>
                    <p className="text-sm text-green-700">Uptime</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{evaluationData.performanceMetrics.avgResponseTime}</p>
                    <p className="text-sm text-blue-700">Response Time</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{evaluationData.performanceMetrics.successRate}</p>
                    <p className="text-sm text-purple-700">Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{evaluationData.performanceMetrics.userSatisfaction}</p>
                    <p className="text-sm text-yellow-700">User Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
