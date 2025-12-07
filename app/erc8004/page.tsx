"use client";

import { useState, useEffect } from "react";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveWallet, useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentRegistration } from "@/components/erc8004/agent-registration";
import { FeedbackSystem } from "@/components/erc8004/feedback-system";
import { ValidationSystem } from "@/components/erc8004/validation-system";
import { ValidatorStaking } from "@/components/erc8004/validator-staking";
import { DetailedEvaluation } from "@/components/erc8004/detailed-evaluation";
import { 
  User, 
  Star, 
  Shield, 
  Bot, 
  CreditCard, 
  CheckCircle, 
  ExternalLink,
  Snowflake,
  Mountain,
  Award,
  Plus,
  Activity
} from "lucide-react";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses (Fuji Testnet)
const CONTRACTS = {
  IdentityRegistry: "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29",
  ReputationRegistry: "0x7Bf906F3ae121c4a3a6b0F17abB2f445B4171015",
  ValidationRegistry: "0x09497aA6eB1281730923495722804CcDf60d707A",
} as const;

// Sample data for demonstration  
const SAMPLE_AGENTS = [
  { id: 1, name: "Study Helper AI", domain: "study-helper", owner: "0x1234...5678", type: "Education" },
  { id: 2, name: "Translator Pro", domain: "translator-pro", owner: "0x2345...6789", type: "Language" },
  { id: 3, name: "Math Teacher AI", domain: "math-teacher", owner: "0x3456...7890", type: "Education" },
  { id: 4, name: "Code Mentor", domain: "code-mentor", owner: "0x4567...8901", type: "Technical" },
  { id: 5, name: "Art Critic AI", domain: "art-critic", owner: "0x5678...9012", type: "Arts" },
];

const SAMPLE_VALIDATIONS = [
  { id: 1, validator: "Math Teacher AI", server: "Study Helper AI", status: "Completed", score: 95, reward: "0.005 AVAX" },
  { id: 2, validator: "Translator Pro", server: "Code Mentor", status: "Pending", score: null, reward: "0.008 AVAX" },
  { id: 3, validator: "Art Critic AI", server: "Translator Pro", status: "Expired", score: null, reward: "0.003 AVAX" },
];

export default function ERC8004Page() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [userAgents, setUserAgents] = useState<number[]>([]);
  const [registeredAgents, setRegisteredAgents] = useState(SAMPLE_AGENTS);
  const [selectedAgentForEvaluation, setSelectedAgentForEvaluation] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Mock data for user's agents (normally would come from contract)
  useEffect(() => {
    if (account?.address) {
      // Simulate user owning agents 1 and 3
      setUserAgents([1, 3]);
    }
  }, [account?.address]);

  const handleAgentRegistered = (agent: { id: number; name: string; domain: string }) => {
    const newAgent = {
      id: agent.id,
      name: agent.name,
      domain: agent.domain,
      owner: account?.address?.substring(0, 6) + "..." + account?.address?.substring(38) || "0x...",
      type: "New",
    };
    setRegisteredAgents(prev => [newAgent, ...prev]);
    setUserAgents(prev => [...prev, agent.id]);
  };

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="flex justify-center space-x-2 text-4xl mb-4">
            <Snowflake className="text-blue-400 animate-pulse" />
            <Mountain className="text-indigo-500" />
            <Bot className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ERC-8004 Trustless Agents
            </h1>
            <p className="text-muted-foreground">Decentralized AI Agent Evaluation System</p>
            <p className="text-sm text-muted-foreground mt-1">Powered by Avalanche Fuji Testnet</p>
          </div>
          <ConnectButton client={client} />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Agent Registration & Evaluation</p>
            <p>• Validation System</p>
            <p>• USDC Payment Features</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Snowflake className="text-blue-500 h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ERC-8004
                  </h1>
                  <p className="text-xs text-muted-foreground">Trustless Agents</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden md:flex">
                <Mountain className="h-3 w-3 mr-1" />
                Avalanche Fuji
              </Badge>
              <ConnectButton client={client} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{SAMPLE_AGENTS.length}</p>
                  <p className="text-xs text-muted-foreground">Registered Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Evaluations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{SAMPLE_VALIDATIONS.length}</p>
                  <p className="text-xs text-muted-foreground">Validations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{userAgents.length}</p>
                  <p className="text-xs text-muted-foreground">Owned Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="registration">Register</TabsTrigger>
            <TabsTrigger value="feedback">Evaluate</TabsTrigger>
            <TabsTrigger value="validation">Validate</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* System Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5" />
                    <span>システム概要</span>
                  </CardTitle>
                  <CardDescription>
                    ERC-8004 Trustless Agentsの基本概念
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 mt-0.5 text-blue-500" />
                      <div>
                        <p className="font-medium">エージェント登録</p>
                        <p className="text-sm text-muted-foreground">
                          0.005 AVAX でAIエージェントを登録
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 mt-0.5 text-yellow-500" />
                      <div>
                        <p className="font-medium">評価システム</p>
                        <p className="text-sm text-muted-foreground">
                          USDCでの支払い付き評価投稿
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 mt-0.5 text-green-500" />
                      <div>
                        <p className="font-medium">検証システム</p>
                        <p className="font-medium">バリデーター機能</p>
                        <p className="text-sm text-muted-foreground">
                          専門家による品質評価とステーキング
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contracts Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ExternalLink className="h-5 w-5" />
                    <span>コントラクト情報</span>
                  </CardTitle>
                  <CardDescription>
                    Avalanche Fuji Testnet デプロイ済み
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(CONTRACTS).map(([name, address]) => (
                    <div key={name} className="space-y-1">
                      <p className="font-medium text-sm">{name}</p>
                      <code className="text-xs bg-muted p-2 rounded block break-all">
                        {address}
                      </code>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Key Features */}
            <Card>
              <CardHeader>
                <CardTitle>重要なポイント</CardTitle>
                <CardDescription>
                  ERC-8004システムの特徴的な機能
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">単一エージェントタイプ</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      全エンティティは同じタイプのエージェントとして登録され、使用時に役割が決まります
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-green-500" />
                      <span className="font-medium">複数役割の兼任</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      1つのエージェントがClient、Server、Validator全ての役割を果たせます
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">USDC決済システム</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      評価投稿時にUSDCでの支払いが必要で、スパム防止に役立ちます
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Directory</CardTitle>
                <CardDescription>
                  Registered AI Agents ({registeredAgents.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {registeredAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {agent.id}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">@{agent.domain}</p>
                            <p className="text-xs text-muted-foreground">{agent.owner}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex gap-1">
                            <Badge variant="secondary">{agent.type}</Badge>
                            {userAgents.includes(agent.id) && (
                              <Badge variant="default">Owned</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedAgentForEvaluation({
                              id: agent.id.toString(),
                              name: agent.name
                            })}
                            className="mt-2"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Registration Tab */}
          <TabsContent value="registration" className="space-y-6">
            <AgentRegistration onAgentRegistered={handleAgentRegistered} />
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <FeedbackSystem agents={registeredAgents} />
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-6">
            <ValidationSystem agents={registeredAgents} />
          </TabsContent>

          {/* Staking Tab */}
          <TabsContent value="staking" className="space-y-6">
            <ValidatorStaking userAgents={userAgents} agents={registeredAgents} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Detailed Evaluation Modal */}
      {selectedAgentForEvaluation && (
        <DetailedEvaluation
          agentId={selectedAgentForEvaluation.id}
          agentName={selectedAgentForEvaluation.name}
          onClose={() => setSelectedAgentForEvaluation(null)}
        />
      )}
    </div>
  );
}