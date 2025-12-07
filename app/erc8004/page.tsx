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
import { ValidatorRegistration } from "@/components/erc8004/validator-registration";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
        <div className="text-center space-y-8 p-10 max-w-lg">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-2xl">
              <div className="flex justify-center space-x-3 text-5xl mb-6">
                <Mountain className="text-red-600 animate-bounce" style={{ animationDelay: '0s' }} />
                <Snowflake className="text-red-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <Bot className="text-orange-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-red-600 via-red-700 to-orange-600 bg-clip-text text-transparent">
                  ERC-8004 Trustless Agents
                </h1>
                <p className="text-gray-700 font-medium">Decentralized AI Agent Evaluation System</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Mountain className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-600 font-semibold">Powered by Avalanche Fuji</p>
                </div>
              </div>
              <div className="my-8">
                <ConnectButton client={client} />
              </div>
              <div className="text-sm text-gray-600 space-y-2 bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span>Agent Registration & NFT Minting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span>Validation System with AVAX Rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span>x402 Payment Protocol Integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100">
      {/* Header */}
      <div className="border-b border-red-200/50 bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                <Mountain className="text-white h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  ERC-8004 Trustless Agents
                </h1>
                <div className="flex items-center space-x-2">
                  <Snowflake className="text-red-200 h-4 w-4" />
                  <p className="text-red-100">Avalanche Fuji Testnet</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden md:flex bg-white/20 border-white/30 text-white">
                <Activity className="h-3 w-3 mr-1" />
                Live Network
              </Badge>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
                <ConnectButton client={client} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/20 border-red-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-800">{SAMPLE_AGENTS.length}</p>
                  <p className="text-sm text-red-600 font-medium">Registered Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-800">156</p>
                  <p className="text-sm text-orange-600 font-medium">Evaluations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/20 border-red-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-800">{SAMPLE_VALIDATIONS.length}</p>
                  <p className="text-sm text-red-600 font-medium">Validations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/20 border-orange-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-800">{userAgents.length}</p>
                  <p className="text-sm text-orange-600 font-medium">Owned Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-gradient-to-r from-red-100 via-orange-100 to-red-100 border border-red-200 shadow-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-50 transition-all">Overview</TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-50 transition-all">Agents</TabsTrigger>
            <TabsTrigger value="registration" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-50 transition-all">Register</TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-50 transition-all">Evaluate</TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-red-50 transition-all">Validate</TabsTrigger>
            <TabsTrigger value="validator" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-50 transition-all">Validator</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Enhanced System Overview - Full Width */}
            <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/10 border-red-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
                <CardTitle className="flex items-center justify-center space-x-4 text-center">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                    <Mountain className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-red-800">ERC-8004 Trustless Agents</span>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Snowflake className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600 font-semibold">Powered by Avalanche Fuji Network</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-center text-red-700 text-lg">
                  Decentralized AI Agent Identity, Reputation & Validation Protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center space-y-4">
                    <div className="mx-auto p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg w-fit">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-800 text-lg">Agent Registration</h3>
                      <p className="text-red-600">
                        Register AI agents as NFTs with 0.005 AVAX fee. Single agent type supports multiple roles: Client, Server, Validator.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="mx-auto p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg w-fit">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-orange-800 text-lg">Evaluation System</h3>
                      <p className="text-orange-600">
                        Submit agent evaluations with USDC payments. Anti-spam protection with feedback authorization system.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="mx-auto p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg w-fit">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">Validation System</h3>
                      <p className="text-green-600">
                        Expert quality assessment with validator staking. AVAX rewards for timely validation responses.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Network Status */}
                <div className="mt-8 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-6 rounded-2xl border border-red-200">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-red-800">Network Status: LIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mountain className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Avalanche Fuji Testnet</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-red-800">{SAMPLE_AGENTS.length}</p>
                      <p className="text-sm text-red-600">Active Agents</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-orange-800">156</p>
                      <p className="text-sm text-orange-600">Total Evaluations</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-800">98.7%</p>
                      <p className="text-sm text-green-600">Network Uptime</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Features */}
            <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-red-800">Key Features</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Mountain className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">System Capabilities</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-red-700">
                  ERC-8004 system distinctive features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-red-800">Single Agent Type</span>
                    </div>
                    <p className="text-sm text-red-600">
                      All entities register as the same agent type, with roles determined during usage
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-orange-800">Multiple Role Support</span>
                    </div>
                    <p className="text-sm text-orange-600">
                      One agent can serve as Client, Server, and Validator simultaneously
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-red-800">USDC Payment System</span>
                    </div>
                    <p className="text-sm text-red-600">
                      USDC payments required for evaluations, preventing spam and ensuring quality
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/10 border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-red-800">Agent Directory</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Mountain className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">ERC-8004 Agent Registry</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-red-700">
                  Registered AI Agents ({registeredAgents.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {registeredAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 border border-red-200 rounded-xl shadow-lg hover:shadow-xl transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                            {agent.id}
                          </div>
                          <div>
                            <p className="font-bold text-red-800">{agent.name}</p>
                            <div className="flex items-center gap-1">
                              <Mountain className="h-3 w-3 text-red-500" />
                              <p className="text-sm text-red-600">@{agent.domain}</p>
                            </div>
                            <p className="text-xs text-red-500">{agent.owner}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">{agent.type}</Badge>
                            {userAgents.includes(agent.id) && (
                              <Badge variant="default" className="bg-gradient-to-r from-red-600 to-orange-600 text-white">Owned</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => setSelectedAgentForEvaluation({
                              id: agent.id.toString(),
                              name: agent.name
                            })}
                            className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Mountain className="h-3 w-3 mr-1" />
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

          {/* Validator Registration Tab */}
          <TabsContent value="validator" className="space-y-6">
            <ValidatorRegistration />
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