"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Award } from "lucide-react";

interface ValidationSystemProps {
  agents?: Array<{ id: number; name: string; domain: string }>;
}

interface ValidationRequest {
  id: string;
  validatorId: number;
  serverId: number;
  dataHash: string;
  reward: string;
  status: "pending" | "completed" | "expired";
  response?: number;
  timestamp: Date;
  expirationTime: Date;
}

export function ValidationSystem({ agents = [] }: ValidationSystemProps) {
  const [requests, setRequests] = useState<ValidationRequest[]>([
    {
      id: "val-1",
      validatorId: 3,
      serverId: 1,
      dataHash: "0x123...abc",
      reward: "0.005 AVAX",
      status: "completed",
      response: 95,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
    {
      id: "val-2", 
      validatorId: 5,
      serverId: 2,
      dataHash: "0x456...def",
      reward: "0.008 AVAX",
      status: "pending",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
    {
      id: "val-3",
      validatorId: 1,
      serverId: 4,
      dataHash: "0x789...ghi",
      reward: "0.003 AVAX",
      status: "expired",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  ]);

  const [newRequest, setNewRequest] = useState({
    validatorId: "",
    serverId: "",
    dataContent: "",
    reward: "0.001",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeRemaining = (expirationTime: Date) => {
    const now = new Date();
    const diff = expirationTime.getTime() - now.getTime();
    
    if (diff <= 0) return "期限切れ";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const getAgentName = (id: number) => {
    const agent = agents.find(a => a.id === id);
    return agent ? agent.name : `エージェント #${id}`;
  };

  const handleSubmitValidationRequest = async () => {
    if (!newRequest.validatorId || !newRequest.serverId || !newRequest.dataContent || !newRequest.reward) {
      alert("全ての項目を入力してください");
      return;
    }

    if (parseFloat(newRequest.reward) < 0.001) {
      alert("最低報酬は0.001 AVAXです");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock data hash generation
      const mockDataHash = "0x" + Array.from({ length: 6 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("") + "...";

      const request: ValidationRequest = {
        id: `val-${Date.now()}`,
        validatorId: parseInt(newRequest.validatorId),
        serverId: parseInt(newRequest.serverId),
        dataHash: mockDataHash + Array.from({ length: 6 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(""),
        reward: `${newRequest.reward} AVAX`,
        status: "pending",
        timestamp: new Date(),
        expirationTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      };

      setRequests(prev => [request, ...prev]);
      
      // Reset form
      setNewRequest({
        validatorId: "",
        serverId: "",
        dataContent: "",
        reward: "0.001",
      });

      alert("検証依頼が送信されました！");
    } catch (error) {
      alert("検証依頼の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidatorResponse = async (requestId: string, response: number) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "completed" as const, response }
          : req
      )
    );
    alert(`検証結果 ${response}/100 を提出しました`);
  };

  return (
    <div className="space-y-6">
      {/* Validation Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>検証依頼</span>
          </CardTitle>
          <CardDescription>
            専門家による作業品質の検証を依頼します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-900">事前承認制</span>
            </div>
            <p className="text-sm text-amber-700">
              検証対象データは管理者による事前承認が必要です
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">バリデーター</label>
              <select
                value={newRequest.validatorId}
                onChange={(e) => setNewRequest(prev => ({ ...prev, validatorId: e.target.value }))}
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
              <label className="block text-sm font-medium mb-2">サーバーID（依頼者）</label>
              <select
                value={newRequest.serverId}
                onChange={(e) => setNewRequest(prev => ({ ...prev, serverId: e.target.value }))}
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

          <div>
            <label className="block text-sm font-medium mb-2">検証対象のデータ</label>
            <textarea
              value={newRequest.dataContent}
              onChange={(e) => setNewRequest(prev => ({ ...prev, dataContent: e.target.value }))}
              placeholder="検証してもらいたい内容を入力してください..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              このデータのハッシュが管理者により事前承認されている必要があります
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">報酬 (AVAX)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={newRequest.reward}
              onChange={(e) => setNewRequest(prev => ({ ...prev, reward: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              最低報酬: 0.001 AVAX
            </p>
          </div>

          <Button 
            onClick={handleSubmitValidationRequest}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "依頼送信中..." : "検証を依頼"}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>検証作業一覧</CardTitle>
          <CardDescription>
            現在の検証依頼状況（{requests.length}件）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {getAgentName(request.validatorId)} → {getAgentName(request.serverId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      報酬: {request.reward} | データハッシュ: {request.dataHash.slice(0, 10)}...
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge 
                      variant={
                        request.status === "completed" ? "default" :
                        request.status === "pending" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {request.status === "completed" ? "完了" :
                       request.status === "pending" ? "進行中" : "期限切れ"}
                    </Badge>
                  </div>
                </div>

                {request.status === "pending" && (
                  <div className="flex items-center space-x-2 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>残り時間: {formatTimeRemaining(request.expirationTime)}</span>
                  </div>
                )}

                {request.status === "completed" && request.response !== undefined && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">検証結果: <strong>{request.response}/100</strong></span>
                  </div>
                )}

                {request.status === "expired" && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>バリデーターの応答期限切れ（スラッシング対象）</span>
                  </div>
                )}

                {/* Mock validator response interface */}
                {request.status === "pending" && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      バリデーター操作エリア（デモ用）
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 95)}
                      >
                        高評価 (95点)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 60)}
                      >
                        普通 (60点)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 30)}
                      >
                        低評価 (30点)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                検証依頼はありません
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>検証プロセス</CardTitle>
          <CardDescription>
            検証システムの流れ（約4-5時間以内に完了）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">事前承認チェック</p>
                <p className="text-sm text-gray-600">データハッシュが許可済みかシステムが確認</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">バリデーター確認</p>
                <p className="text-sm text-gray-600">指定されたバリデーターがアクティブか確認</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">期限設定</p>
                <p className="text-sm text-gray-600">1000ブロック（約4-5時間）の応答期限を設定</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                4
              </div>
              <div>
                <p className="font-medium">検証実行</p>
                <p className="text-sm text-gray-600">バリデーターが0-100点で品質を評価</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                5
              </div>
              <div>
                <p className="font-medium">報酬支払い</p>
                <p className="text-sm text-gray-600">検証完了と同時にバリデーターに報酬を送金</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}