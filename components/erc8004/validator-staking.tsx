"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Shield, AlertTriangle, TrendingUp, DollarSign, Activity } from "lucide-react";

interface ValidatorStakingProps {
  userAgents?: number[];
  agents?: Array<{ id: number; name: string; domain: string }>;
}

interface ValidatorStats {
  agentId: number;
  stakedAmount: number;
  totalValidations: number;
  averageScore: number;
  totalEarned: number;
  isActive: boolean;
}

export function ValidatorStaking({ userAgents = [], agents = [] }: ValidatorStakingProps) {
  const [stakingForm, setStakingForm] = useState({
    agentId: "",
    amount: "0.1",
  });
  const [isStaking, setIsStaking] = useState(false);
  
  // Mock validator stats
  const [validatorStats, setValidatorStats] = useState<ValidatorStats[]>([
    {
      agentId: 1,
      stakedAmount: 0.15,
      totalValidations: 23,
      averageScore: 92.5,
      totalEarned: 0.045,
      isActive: true,
    },
    {
      agentId: 3,
      stakedAmount: 0.25,
      totalValidations: 15,
      averageScore: 88.7,
      totalEarned: 0.032,
      isActive: true,
    },
  ]);

  const getAgentName = (id: number) => {
    const agent = agents.find(a => a.id === id);
    return agent ? agent.name : `エージェント #${id}`;
  };

  const handleStaking = async () => {
    if (!stakingForm.agentId || !stakingForm.amount) {
      alert("全ての項目を入力してください");
      return;
    }

    const amount = parseFloat(stakingForm.amount);
    if (amount < 0.1) {
      alert("最低ステーキング額は0.1 AVAXです");
      return;
    }

    setIsStaking(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const agentId = parseInt(stakingForm.agentId);
      
      // Update or create validator stats
      setValidatorStats(prev => {
        const existingIndex = prev.findIndex(v => v.agentId === agentId);
        
        if (existingIndex >= 0) {
          // Add to existing stake
          const updated = [...prev];
          updated[existingIndex].stakedAmount += amount;
          updated[existingIndex].isActive = true;
          return updated;
        } else {
          // Create new validator
          return [...prev, {
            agentId,
            stakedAmount: amount,
            totalValidations: 0,
            averageScore: 0,
            totalEarned: 0,
            isActive: true,
          }];
        }
      });

      alert(`${amount} AVAX のステーキングが完了しました！`);
      setStakingForm({ agentId: "", amount: "0.1" });
    } catch (error) {
      alert("ステーキングに失敗しました");
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstaking = async (agentId: number, amount: number) => {
    try {
      setValidatorStats(prev => 
        prev.map(v => 
          v.agentId === agentId 
            ? { 
                ...v, 
                stakedAmount: Math.max(0, v.stakedAmount - amount),
                isActive: v.stakedAmount - amount >= 0.1
              }
            : v
        )
      );
      alert(`${amount} AVAX をアンステークしました`);
    } catch (error) {
      alert("アンステークに失敗しました");
    }
  };

  const totalStaked = validatorStats.reduce((sum, v) => sum + v.stakedAmount, 0);
  const totalEarned = validatorStats.reduce((sum, v) => sum + v.totalEarned, 0);
  const activeValidators = validatorStats.filter(v => v.isActive).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-lg font-bold">{totalStaked.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">AVAX ステーキング中</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold">{activeValidators}</p>
                <p className="text-xs text-muted-foreground">アクティブバリデーター</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-lg font-bold">
                  {validatorStats.reduce((sum, v) => sum + v.totalValidations, 0)}
                </p>
                <p className="text-xs text-muted-foreground">総検証数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{totalEarned.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">AVAX 獲得済み</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>バリデーター登録</span>
          </CardTitle>
          <CardDescription>
            専門家として働くために保証金をステーキングします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Award className="h-4 w-4 mr-2" />
              バリデーター要件
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 最低 0.1 AVAX のステーキング</li>
              <li>• 検証作業の報酬を獲得</li>
              <li>• 無応答時は10%のペナルティ</li>
              <li>• 継続的な専門性の提供</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">エージェントID</label>
              <select
                value={stakingForm.agentId}
                onChange={(e) => setStakingForm(prev => ({ ...prev, agentId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {agents
                  .filter(agent => userAgents.includes(agent.id))
                  .map(agent => (
                    <option key={agent.id} value={agent.id.toString()}>
                      #{agent.id} - {agent.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                所有しているエージェントのみ選択可能
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ステーキング額 (AVAX)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={stakingForm.amount}
                onChange={(e) => setStakingForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                最低ステーキング額: 0.1 AVAX
              </p>
            </div>
          </div>

          <Button 
            onClick={handleStaking}
            disabled={isStaking || !stakingForm.agentId || parseFloat(stakingForm.amount) < 0.1}
            className="w-full"
          >
            {isStaking ? "ステーキング中..." : "バリデーターとしてステーキング"}
          </Button>
        </CardContent>
      </Card>

      {/* Validator Stats */}
      <Card>
        <CardHeader>
          <CardTitle>バリデーター状況</CardTitle>
          <CardDescription>
            あなたのバリデーター活動状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validatorStats.length > 0 ? (
            <div className="space-y-4">
              {validatorStats.map((validator) => (
                <div 
                  key={validator.agentId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getAgentName(validator.agentId)}</p>
                      <p className="text-sm text-gray-600">エージェント #{validator.agentId}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={validator.isActive ? "default" : "secondary"}>
                        {validator.isActive ? "アクティブ" : "非アクティブ"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {validator.stakedAmount.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">AVAX ステーキング</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {validator.totalValidations}
                      </p>
                      <p className="text-xs text-muted-foreground">検証完了数</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {validator.averageScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">平均スコア</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">
                        {validator.totalEarned.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">AVAX 獲得</p>
                    </div>
                  </div>

                  {validator.isActive && validator.stakedAmount > 0.1 && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUnstaking(validator.agentId, 0.05)}
                      >
                        0.05 AVAX アンステーク
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUnstaking(validator.agentId, 0.1)}
                      >
                        0.1 AVAX アンステーク
                      </Button>
                    </div>
                  )}

                  {!validator.isActive && (
                    <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm text-amber-700">
                          最低ステーキング額（0.1 AVAX）を下回っています
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              まだバリデーターとして登録されていません
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slashing Information */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            <span>スラッシング（ペナルティ）システム</span>
          </CardTitle>
          <CardDescription className="text-amber-700">
            バリデーターの責任とリスクについて
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-amber-800">
            <p className="font-medium">ペナルティ条件:</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• 検証依頼に期限内（1000ブロック≈4-5時間）に応答しない</li>
              <li>• ステーキング額の10%が没収される</li>
              <li>• 没収された額は依頼者に補償として支払われる</li>
              <li>• 最低ステーキング額を下回ると非アクティブ化</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <p className="text-sm font-medium text-amber-900">
              責任ある検証作業を継続することで、安定した報酬を獲得できます
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}