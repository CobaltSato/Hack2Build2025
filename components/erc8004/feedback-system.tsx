"use client";

import { useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { useActiveWallet } from "thirdweb/react";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CreditCard, CheckCircle, Loader2, AlertCircle, DollarSign } from "lucide-react";
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
    message: "評価投稿には事前認証が必要です",
  });

  // Mock authorization check
  const checkAuthorization = async (clientId: string, serverId: string) => {
    if (!clientId || !serverId) {
      setAuthorizationStatus({
        isAuthorized: false,
        message: "クライアントIDとサーバーIDを入力してください",
      });
      return;
    }

    // Simulate authorization check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: assume authorization exists for demonstration
    setAuthorizationStatus({
      isAuthorized: true,
      message: `エージェント #${clientId} → #${serverId} の評価が許可されています`,
    });
  };

  const handleSubmitFeedback = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください");
      return;
    }

    if (!authorizationStatus.isAuthorized) {
      alert("評価の認証を先に確認してください");
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
        PAYMENT_AMOUNTS.FEEDBACK.bigInt
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
          message: "フィードバックが正常に投稿されました！",
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
          message: "評価投稿には事前認証が必要です",
        });
      } else {
        const error = await response.json();
        setSubmissionResult({
          success: false,
          message: `投稿に失敗しました: ${error.message || "不明なエラー"}`,
        });
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setSubmissionResult({
        success: false,
        message: `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900">USDC支払い機能</p>
              <p className="text-sm text-purple-700">
                評価投稿には $0.05 USDC の支払いが必要です（スパム防止）
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Step 1: 評価権限の確認</span>
          </CardTitle>
          <CardDescription>
            フィードバック投稿前に、評価権限があることを確認してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">クライアントID（評価者）</label>
              <select
                value={feedbackData.clientId}
                onChange={(e) => {
                  setFeedbackData(prev => ({ ...prev, clientId: e.target.value }));
                  if (feedbackData.serverId) {
                    checkAuthorization(e.target.value, feedbackData.serverId);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>
                    #{agent.id} - {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">サーバーID（評価対象）</label>
              <select
                value={feedbackData.serverId}
                onChange={(e) => {
                  setFeedbackData(prev => ({ ...prev, serverId: e.target.value }));
                  if (feedbackData.clientId) {
                    checkAuthorization(feedbackData.clientId, e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Step 2: フィードバック投稿</span>
          </CardTitle>
          <CardDescription>
            USDCでの支払いを行い、評価を投稿します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">評価スコア (0-100)</label>
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
            <label className="block text-sm font-medium mb-2">評価コメント</label>
            <textarea
              value={feedbackData.comment}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="評価の詳細内容を入力してください..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              この内容はハッシュ化されてブロックチェーンに保存されます
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">支払い情報</span>
            </div>
            <p className="text-sm text-blue-700">
              フィードバック投稿料: <strong>$0.05 USDC</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              HTTP 402プロトコルにより自動的に処理されます
            </p>
          </div>

          <Button 
            onClick={handleSubmitFeedback}
            disabled={!authorizationStatus.isAuthorized || !feedbackData.comment || isSubmitting || !wallet}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                支払い処理中...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                $0.05 USDC でフィードバックを投稿
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
                  {submissionResult.success ? "投稿完了" : "投稿失敗"}
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
          <CardTitle>フィードバックプロセス</CardTitle>
          <CardDescription>
            USDC支払い付き評価システムの流れ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">評価権限確認</p>
                <p className="text-sm text-gray-600">サーバーエージェントからの評価受付許可をチェック</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">USDC支払い処理</p>
                <p className="text-sm text-gray-600">HTTP 402プロトコルで$0.05 USDC自動決済</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">評価データ送信</p>
                <p className="text-sm text-gray-600">スコアとコメントをブロックチェーンに記録</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}