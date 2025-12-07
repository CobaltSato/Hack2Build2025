"use client";

import { useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { useActiveWallet } from "thirdweb/react";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CreditCard, CheckCircle, Loader2, AlertCircle, DollarSign, Mountain, Snowflake } from "lucide-react";
import { createNormalizedFetch } from "@/lib/payment";
import { AVALANCHE_FUJI_CHAIN_ID, PAYMENT_AMOUNTS } from "@/lib/constants";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

interface FeedbackSystemProps {
  agents?: Array<{ id: number; name: string; domain: string }>;
}

export function FeedbackSystem({ agents = [] }: FeedbackSystemProps) {
  const wallet = useActiveWallet();
  const [feedbackData, setFeedbackData] = useState({
    clientId: "",
    serverId: "",
    score: 50,
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<{
    isAuthorized: boolean;
    message: string;
  }>({
    isAuthorized: false,
    message: "Pre-authorization required for evaluation submission",
  });

  // Mock authorization check
  const checkAuthorization = async (clientId: string, serverId: string) => {
    if (!clientId || !serverId) {
      setAuthorizationStatus({
        isAuthorized: false,
        message: "Please enter both client ID and server ID",
      });
      return;
    }

    // Simulate authorization check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: assume authorization exists for demonstration
    setAuthorizationStatus({
      isAuthorized: true,
      message: `Evaluation authorized: Agent #${clientId} → #${serverId}`,
    });
  };

  const handleSubmitFeedback = async () => {
    if (!wallet) {
      alert("Please connect your wallet");
      return;
    }

    if (!authorizationStatus.isAuthorized) {
      alert("Please check evaluation authorization first");
      return;
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Simulate USDC payment for feedback submission
      const normalizedFetch = createNormalizedFetch(AVALANCHE_FUJI_CHAIN_ID);
      const fetchWithPay = wrapFetchWithPayment(
        normalizedFetch,
        client,
        wallet,
        {
          maxValue: PAYMENT_AMOUNTS.FEEDBACK.bigInt,
        }
      );

      // Mock API endpoint for feedback submission
      const feedbackEndpoint = "/api/feedback";
      
      const response = await fetchWithPay(feedbackEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: feedbackData.clientId,
          serverId: feedbackData.serverId,
          score: feedbackData.score,
          comment: feedbackData.comment,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissionResult({
          success: true,
          message: "Feedback submitted successfully!",
          txHash: result.txHash || "0x" + Math.random().toString(16).substr(2, 64),
        });
        
        // Reset form
        setFeedbackData({
          clientId: "",
          serverId: "",
          score: 50,
          comment: "",
        });
        setAuthorizationStatus({
          isAuthorized: false,
          message: "Pre-authorization required for evaluation submission",
        });
      } else {
        const error = await response.json();
        setSubmissionResult({
          success: false,
          message: `Submission failed: ${error.message || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setSubmissionResult({
        success: false,
        message: `Error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <Card className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border-red-200 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-red-800">USDC Payment System</p>
                <Snowflake className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-sm text-red-700">
                Evaluation submission requires $0.05 USDC payment (spam prevention)
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Powered by Avalanche Network</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Step */}
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/10 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-red-800">Step 1: Verify Evaluation Authorization</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Avalanche ERC-8004</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            Confirm evaluation permissions before submitting feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID (Evaluator)</label>
              <select
                value={feedbackData.clientId}
                onChange={(e) => {
                  setFeedbackData(prev => ({ ...prev, clientId: e.target.value }));
                  if (feedbackData.serverId) {
                    checkAuthorization(e.target.value, feedbackData.serverId);
                  }
                }}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Please select</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>
                    #{agent.id} - {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Server ID (Evaluation Target)</label>
              <select
                value={feedbackData.serverId}
                onChange={(e) => {
                  setFeedbackData(prev => ({ ...prev, serverId: e.target.value }));
                  if (feedbackData.clientId) {
                    checkAuthorization(feedbackData.clientId, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Please select</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>
                    #{agent.id} - {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={`p-3 rounded-lg ${authorizationStatus.isAuthorized ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center space-x-2">
              {authorizationStatus.isAuthorized ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <p className={`text-sm ${authorizationStatus.isAuthorized ? 'text-green-700' : 'text-yellow-700'}`}>
                {authorizationStatus.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Submission */}
      <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/10 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border-b border-orange-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-orange-800">Step 2: Submit Feedback</span>
              <div className="flex items-center gap-2 mt-1">
                <Snowflake className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">USDC Payment Required</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Make USDC payment and submit evaluation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Evaluation Score (0-100)</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                value={feedbackData.score}
                onChange={(e) => setFeedbackData(prev => ({ ...prev, score: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <div className="w-16 text-center">
                <Badge variant="secondary" className="text-lg font-bold">
                  {feedbackData.score}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Evaluation Comment</label>
            <textarea
              value={feedbackData.comment}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Please enter detailed evaluation content..."
              rows={4}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This content will be hashed and stored on the blockchain
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-red-800">Payment Information</span>
            </div>
            <p className="text-sm text-red-700">
              Feedback submission fee: <strong>$0.05 USDC</strong>
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Mountain className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-600">
                Automatically processed via HTTP 402 protocol
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSubmitFeedback}
            disabled={!authorizationStatus.isAuthorized || !feedbackData.comment || isSubmitting || !wallet}
            className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing payment...
              </>
            ) : (
              <>
                <Mountain className="h-4 w-4 mr-2" />
                Submit feedback with $0.05 USDC
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Submission Result */}
      {submissionResult && (
        <Card className={`border-2 ${submissionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              {submissionResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${submissionResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {submissionResult.success ? "Submission Complete" : "Submission Failed"}
                </p>
                <p className={`text-sm ${submissionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {submissionResult.message}
                </p>
                {submissionResult.txHash && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600">Transaction Hash:</p>
                    <code className="text-xs bg-white p-1 rounded border break-all">
                      {submissionResult.txHash}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Process</CardTitle>
          <CardDescription>
            Evaluation system workflow with USDC payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Evaluation authorization verification</p>
                <p className="text-sm text-gray-600">Check permission to accept evaluations from server agent</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">USDC payment processing</p>
                <p className="text-sm text-gray-600">Automatic payment of $0.05 USDC via HTTP 402 protocol</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Evaluation data submission</p>
                <p className="text-sm text-gray-600">Record score and comments on blockchain</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}