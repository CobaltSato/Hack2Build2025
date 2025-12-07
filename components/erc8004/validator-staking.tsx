"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Shield, AlertTriangle, TrendingUp, DollarSign, Activity, Mountain, Snowflake } from "lucide-react";

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
    return agent ? agent.name : `Agent #${id}`;
  };

  const handleStaking = async () => {
    if (!stakingForm.agentId || !stakingForm.amount) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(stakingForm.amount);
    if (amount < 0.1) {
      alert("Minimum staking amount is 0.1 AVAX");
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

      alert(`${amount} AVAX staking completed successfully!`);
      setStakingForm({ agentId: "", amount: "0.1" });
    } catch (error) {
      alert("Staking failed");
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
      alert(`${amount} AVAX unstaked successfully`);
    } catch (error) {
      alert("Unstaking failed");
    }
  };

  const totalStaked = validatorStats.reduce((sum, v) => sum + v.stakedAmount, 0);
  const totalEarned = validatorStats.reduce((sum, v) => sum + v.totalEarned, 0);
  const activeValidators = validatorStats.filter(v => v.isActive).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/20 border-red-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-800">{totalStaked.toFixed(3)}</p>
                <p className="text-sm text-red-600 font-medium">AVAX Staked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-800">{activeValidators}</p>
                <p className="text-sm text-orange-600 font-medium">Active Validators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/20 border-red-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-800">
                  {validatorStats.reduce((sum, v) => sum + v.totalValidations, 0)}
                </p>
                <p className="text-sm text-red-600 font-medium">Total Validations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/20 border-orange-200 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-800">{totalEarned.toFixed(3)}</p>
                <p className="text-sm text-orange-600 font-medium">AVAX Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staking Form */}
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/10 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-red-800">Validator Registration</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Avalanche Validator Staking</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            Stake collateral to work as an expert validator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-4 rounded-xl border border-red-200">
            <h4 className="font-bold mb-3 flex items-center text-red-800">
              <div className="p-1 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg mr-2">
                <Award className="h-4 w-4 text-white" />
              </div>
              Validator Requirements
            </h4>
            <ul className="text-sm text-red-700 space-y-2">
              <li className="flex items-center gap-2">
                <Mountain className="h-3 w-3 text-red-500" />
                Minimum 0.1 AVAX staking
              </li>
              <li className="flex items-center gap-2">
                <Snowflake className="h-3 w-3 text-red-500" />
                Earn rewards from validation work
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                10% penalty for non-response
              </li>
              <li className="flex items-center gap-2">
                <Award className="h-3 w-3 text-red-500" />
                Continuous expertise provision
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Agent ID</label>
              <select
                value={stakingForm.agentId}
                onChange={(e) => setStakingForm(prev => ({ ...prev, agentId: e.target.value }))}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Please select</option>
                {agents
                  .filter(agent => userAgents.includes(agent.id))
                  .map(agent => (
                    <option key={agent.id} value={agent.id.toString()}>
                      #{agent.id} - {agent.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only owned agents can be selected
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Staking Amount (AVAX)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={stakingForm.amount}
                onChange={(e) => setStakingForm(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum staking amount: 0.1 AVAX
              </p>
            </div>
          </div>

          <Button 
            onClick={handleStaking}
            disabled={isStaking || !stakingForm.agentId || parseFloat(stakingForm.amount) < 0.1}
            className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isStaking ? (
              <>
                <Shield className="h-4 w-4 mr-2 animate-spin" />
                <span>Staking...</span>
              </>
            ) : (
              <>
                <Mountain className="h-4 w-4 mr-2" />
                <span>Stake as Validator</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validator Stats */}
      <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/10 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border-b border-orange-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-orange-800">Validator Status</span>
              <div className="flex items-center gap-2 mt-1">
                <Snowflake className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">Your Validator Activity</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Your validator activity status
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
                      <p className="text-sm text-gray-600">Agent #{validator.agentId}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={validator.isActive ? "default" : "secondary"}>
                        {validator.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {validator.stakedAmount.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">AVAX Staked</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">
                        {validator.totalValidations}
                      </p>
                      <p className="text-xs text-muted-foreground">Validations Completed</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">
                        {validator.averageScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Average Score</p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">
                        {validator.totalEarned.toFixed(3)}
                      </p>
                      <p className="text-xs text-muted-foreground">AVAX Earned</p>
                    </div>
                  </div>

                  {validator.isActive && validator.stakedAmount > 0.1 && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUnstaking(validator.agentId, 0.05)}
                      >
                        Unstake 0.05 AVAX
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUnstaking(validator.agentId, 0.1)}
                      >
                        Unstake 0.1 AVAX
                      </Button>
                    </div>
                  )}

                  {!validator.isActive && (
                    <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <p className="text-sm text-amber-700">
                          Below minimum staking amount (0.1 AVAX)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Not yet registered as a validator
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slashing Information */}
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-red-800">Slashing (Penalty) System</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Risk Management System</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            About validator responsibilities and risks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-amber-800">
            <p className="font-medium">Penalty Conditions:</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• No response to validation requests within deadline (1000 blocks ≈ 4-5 hours)</li>
              <li>• 10% of staked amount is confiscated</li>
              <li>• Confiscated amount is paid to requester as compensation</li>
              <li>• Deactivated if below minimum staking amount</li>
            </ul>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <p className="text-sm font-medium text-amber-900">
              Stable rewards can be earned by continuing responsible validation work
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}