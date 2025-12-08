"use client";

import { useState, useEffect } from "react";
import { createThirdwebClient, getContract, prepareContractCall, readContract } from "thirdweb";
import { useActiveWallet, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CreditCard, CheckCircle, Loader2, AlertCircle, DollarSign, Mountain, Snowflake, Search, Shield, ExternalLink } from "lucide-react";
import { createNormalizedFetch } from "@/lib/payment";
import { AVALANCHE_FUJI_CHAIN_ID, PAYMENT_AMOUNTS } from "@/lib/constants";
import { avalancheFuji } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses (Fuji Testnet)
const REPUTATION_REGISTRY_ADDRESS = "0x7Bf906F3ae121c4a3a6b0F17abB2f445B4171015";
const IDENTITY_REGISTRY_ADDRESS = "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29";

const reputationContract = getContract({
  client,
  chain: avalancheFuji,
  address: REPUTATION_REGISTRY_ADDRESS,
});

const identityContract = getContract({
  client,
  chain: avalancheFuji,
  address: IDENTITY_REGISTRY_ADDRESS,
});

interface RealAgent {
  tokenId: number;
  domain: string;
  cardURI: string;
  owner: string;
  exists: boolean;
}

interface FeedbackSystemProps {
  agents?: Array<{ id: number; name: string; domain: string }>;
}

export function FeedbackSystem({ agents = [] }: FeedbackSystemProps) {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();
  
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
    snowtraceUrl?: string;
  } | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<{
    isAuthorized: boolean;
    message: string;
  }>({
    isAuthorized: false,
    message: "Pre-authorization required for evaluation submission",
  });
  
  // State for accept feedback functionality
  const [isAcceptingFeedback, setIsAcceptingFeedback] = useState(false);
  const [isRevokingFeedback, setIsRevokingFeedback] = useState(false);
  const [acceptFeedbackData, setAcceptFeedbackData] = useState({
    agentClientId: "",
    agentServerId: "",
  });
  const [acceptFeedbackResult, setAcceptFeedbackResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
    snowtraceUrl?: string;
    type: 'accept' | 'revoke';
  } | null>(null);

  // State for real agent lookup
  const [agentLookup, setAgentLookup] = useState({
    tokenId: "",
    isLoading: false,
  });
  const [realAgents, setRealAgents] = useState<{ [key: string]: RealAgent }>({});
  const [searchResults, setSearchResults] = useState<RealAgent[]>([]);
  const [whitelistStatus, setWhitelistStatus] = useState<{
    isChecked: boolean;
    isWhitelisted: boolean;
    message: string;
  }>({
    isChecked: false,
    isWhitelisted: false,
    message: "Click to check whitelist status",
  });
  const [feedbackStatus, setFeedbackStatus] = useState<{
    isChecked: boolean;
    hasAlreadySubmitted: boolean;
    message: string;
  }>({
    isChecked: false,
    hasAlreadySubmitted: false,
    message: "Click to check feedback status",
  });

  // Real agent lookup function
  const lookupAgent = async (tokenId: string) => {
    if (!tokenId || tokenId.trim() === "") return null;
    
    // Check cache first
    if (realAgents[tokenId]) {
      return realAgents[tokenId];
    }

    setAgentLookup(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Check if token exists
      const exists = await readContract({
        contract: identityContract,
        method: "function agentExists(uint256 tokenId) external view returns (bool)",
        params: [BigInt(tokenId)],
      });

      if (!exists) {
        setAgentLookup(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      // Get agent info using the getAgent function
      const [agentId, domain, owner, cardURI] = await readContract({
        contract: identityContract,
        method: "function getAgent(uint256 tokenId) external view returns (uint256, string memory, address, string memory)",
        params: [BigInt(tokenId)],
      });

      const agent: RealAgent = {
        tokenId: parseInt(tokenId),
        domain: domain as string,
        cardURI: cardURI as string,
        owner: owner as string,
        exists: true,
      };

      // Cache the result
      setRealAgents(prev => ({ ...prev, [tokenId]: agent }));
      setAgentLookup(prev => ({ ...prev, isLoading: false }));
      
      return agent;
    } catch (error) {
      console.error('Error looking up agent:', error);
      setAgentLookup(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  };

  // Handle agent search
  const handleAgentSearch = async () => {
    const agent = await lookupAgent(agentLookup.tokenId);
    if (agent) {
      setSearchResults([agent]);
    } else {
      setSearchResults([]);
      alert(`Agent with Token ID ${agentLookup.tokenId} not found`);
    }
  };

  // Auto-lookup agent when TokenID is entered
  const handleTokenIdLookup = async (tokenId: string) => {
    if (tokenId && tokenId.trim() !== "" && !realAgents[tokenId]) {
      await lookupAgent(tokenId);
    }
  };

  // Check whitelist status
  const checkWhitelistStatus = async () => {
    if (!wallet || !account) {
      setWhitelistStatus({
        isChecked: true,
        isWhitelisted: false,
        message: "❌ Please connect your wallet first",
      });
      return;
    }

    try {
      const isWhitelisted = await readContract({
        contract: reputationContract,
        method: "function isWhitelisted(address account) external view returns (bool)",
        params: [account.address as `0x${string}`],
      });

      setWhitelistStatus({
        isChecked: true,
        isWhitelisted,
        message: isWhitelisted 
          ? "✅ Your address is whitelisted for feedback submission"
          : "❌ Your address is not whitelisted. Contact an admin to get whitelisted.",
      });
    } catch (error) {
      console.error('Whitelist check failed:', error);
      setWhitelistStatus({
        isChecked: true,
        isWhitelisted: false,
        message: `⚠️ Failed to check whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Check feedback submission status
  const checkFeedbackStatus = async () => {
    if (!feedbackData.clientId || !feedbackData.serverId) {
      setFeedbackStatus({
        isChecked: true,
        hasAlreadySubmitted: false,
        message: "❌ Please enter both client ID and server ID",
      });
      return;
    }

    try {
      const hasAlreadySubmitted = await readContract({
        contract: reputationContract,
        method: "function hasFeedback(uint256 clientId, uint256 serverId) external view returns (bool)",
        params: [BigInt(feedbackData.clientId), BigInt(feedbackData.serverId)],
      });

      setFeedbackStatus({
        isChecked: true,
        hasAlreadySubmitted,
        message: hasAlreadySubmitted 
          ? `❌ Feedback already submitted between Agent #${feedbackData.clientId} and Agent #${feedbackData.serverId}`
          : `✅ No feedback submitted yet between Agent #${feedbackData.clientId} and Agent #${feedbackData.serverId}`,
      });
    } catch (error) {
      console.error('Feedback status check failed:', error);
      setFeedbackStatus({
        isChecked: true,
        hasAlreadySubmitted: false,
        message: `⚠️ Failed to check feedback status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  // Accept feedback function (Server role allows Client to evaluate)
  const handleAcceptFeedback = async () => {
    if (!wallet || !account) {
      alert("Please connect your wallet");
      return;
    }

    if (!acceptFeedbackData.agentClientId || !acceptFeedbackData.agentServerId) {
      alert("Please enter both client ID and server ID");
      return;
    }

    setIsAcceptingFeedback(true);
    
    try {
      // First check if feedback is already authorized
      const [isAuthorized] = await readContract({
        contract: reputationContract,
        method: "function isFeedbackAuthorized(uint256 agentClientId, uint256 agentServerId) external view returns (bool, bytes32)",
        params: [BigInt(acceptFeedbackData.agentClientId), BigInt(acceptFeedbackData.agentServerId)],
      });

      if (isAuthorized) {
        alert(`ℹ️ Feedback is already authorized between Agent #${acceptFeedbackData.agentClientId} and Agent #${acceptFeedbackData.agentServerId}. No need to authorize again.`);
        setIsAcceptingFeedback(false);
        return;
      }

      const transaction = prepareContractCall({
        contract: reputationContract,
        method: "function acceptFeedback(uint256 agentClientId, uint256 agentServerId) external",
        params: [
          BigInt(acceptFeedbackData.agentClientId),
          BigInt(acceptFeedbackData.agentServerId)
        ],
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Accept feedback transaction successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setAcceptFeedbackResult({
            success: true,
            message: "Feedback authorization created successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
            type: 'accept',
          });
          
          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');
          
          setAcceptFeedbackData({ agentClientId: "", agentServerId: "" });
          
          // Refresh authorization check if the same IDs are in feedback form
          if (feedbackData.clientId === acceptFeedbackData.agentClientId && 
              feedbackData.serverId === acceptFeedbackData.agentServerId) {
            checkAuthorization(feedbackData.clientId, feedbackData.serverId);
          }
        },
        onError: (error) => {
          console.error('Accept feedback transaction failed:', error);
          
          // Handle specific error cases
          let errorMessage = "Failed to accept feedback";
          if (error.message.includes("0x49c4c798")) {
            errorMessage = "❌ Feedback already authorized between these agents";
          } else if (error.message.includes("UnauthorizedUpdate")) {
            errorMessage = "❌ You must be the owner of the server agent to authorize feedback";
          } else if (error.message.includes("AgentNotFound")) {
            errorMessage = "❌ One or both agents not found. Please verify TokenIDs exist.";
          } else if (error.message.includes("SameAgent")) {
            errorMessage = "❌ Client and server agents cannot be the same";
          }
          
          setAcceptFeedbackResult({
            success: false,
            message: `${errorMessage}: ${error.message}`,
            type: 'accept',
          });
        },
      });
    } catch (error) {
      console.error('Accept feedback error:', error);
      setAcceptFeedbackResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'accept',
      });
      setIsAcceptingFeedback(false);
    }
  };

  // Revoke feedback function (remove existing authorization)
  const handleRevokeFeedback = async () => {
    if (!wallet || !account) {
      alert("Please connect your wallet");
      return;
    }

    if (!acceptFeedbackData.agentClientId || !acceptFeedbackData.agentServerId) {
      alert("Please enter both client ID and server ID");
      return;
    }

    setIsRevokingFeedback(true);
    
    try {
      // First check if feedback is authorized
      const [isAuthorized] = await readContract({
        contract: reputationContract,
        method: "function isFeedbackAuthorized(uint256 agentClientId, uint256 agentServerId) external view returns (bool, bytes32)",
        params: [BigInt(acceptFeedbackData.agentClientId), BigInt(acceptFeedbackData.agentServerId)],
      });

      if (!isAuthorized) {
        alert(`ℹ️ No authorization exists between Agent #${acceptFeedbackData.agentClientId} and Agent #${acceptFeedbackData.agentServerId}. Nothing to revoke.`);
        setIsRevokingFeedback(false);
        return;
      }

      const transaction = prepareContractCall({
        contract: reputationContract,
        method: "function revokeFeedback(uint256 agentClientId, uint256 agentServerId) external",
        params: [
          BigInt(acceptFeedbackData.agentClientId),
          BigInt(acceptFeedbackData.agentServerId)
        ],
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Revoke feedback transaction successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setAcceptFeedbackResult({
            success: true,
            message: "Feedback authorization revoked successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
            type: 'revoke',
          });
          
          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');
          
          // Refresh authorization check if the same IDs are in feedback form
          if (feedbackData.clientId === acceptFeedbackData.agentClientId && 
              feedbackData.serverId === acceptFeedbackData.agentServerId) {
            checkAuthorization(feedbackData.clientId, feedbackData.serverId);
          }
        },
        onError: (error) => {
          console.error('Revoke feedback transaction failed:', error);
          setAcceptFeedbackResult({
            success: false,
            message: `❌ Failed to revoke feedback authorization: ${error.message}`,
            type: 'revoke',
          });
        },
      });
    } catch (error) {
      console.error('Revoke feedback error:', error);
      setAcceptFeedbackResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'revoke',
      });
    } finally {
      setIsRevokingFeedback(false);
    }
  };

  // Check authorization status (real contract call)
  const checkAuthorization = async (clientId: string, serverId: string) => {
    if (!clientId || !serverId) {
      setAuthorizationStatus({
        isAuthorized: false,
        message: "Please enter both client ID and server ID",
      });
      return;
    }

    try {
      // Check if feedback is authorized in contract
      const [isAuthorized, feedbackAuthId] = await readContract({
        contract: reputationContract,
        method: "function isFeedbackAuthorized(uint256 agentClientId, uint256 agentServerId) external view returns (bool, bytes32)",
        params: [BigInt(clientId), BigInt(serverId)],
      });

      if (isAuthorized) {
        setAuthorizationStatus({
          isAuthorized: true,
          message: `✅ Feedback authorized: Agent #${clientId} → #${serverId} (Auth ID: ${feedbackAuthId})`,
        });
      } else {
        setAuthorizationStatus({
          isAuthorized: false,
          message: `❌ No authorization found. Server #${serverId} must first call acceptFeedback() to authorize client #${clientId}.`,
        });
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
      setAuthorizationStatus({
        isAuthorized: false,
        message: `⚠️ Failed to check authorization: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!wallet || !account) {
      alert("Please connect your wallet");
      return;
    }

    if (!authorizationStatus.isAuthorized) {
      alert("Please check evaluation authorization first");
      return;
    }

    if (!feedbackData.comment || feedbackData.comment.trim().length === 0) {
      alert("Please enter a comment for your feedback");
      return;
    }

    // Check if user is whitelisted
    try {
      const isWhitelisted = await readContract({
        contract: reputationContract,
        method: "function isWhitelisted(address account) external view returns (bool)",
        params: [account.address as `0x${string}`],
      });

      if (!isWhitelisted) {
        alert("❌ Your address is not whitelisted for feedback submission. Please contact an administrator.");
        return;
      }
    } catch (error) {
      console.error('Whitelist check failed:', error);
      alert("Failed to verify whitelist status. Please try again.");
      return;
    }

    // Check if feedback has already been submitted
    try {
      const hasAlreadySubmitted = await readContract({
        contract: reputationContract,
        method: "function hasFeedback(uint256 clientId, uint256 serverId) external view returns (bool)",
        params: [BigInt(feedbackData.clientId), BigInt(feedbackData.serverId)],
      });

      if (hasAlreadySubmitted) {
        alert("❌ Feedback has already been submitted between these agents. Each client can only submit feedback once per server agent.");
        return;
      }
    } catch (error) {
      console.error('Feedback check failed:', error);
      // Continue anyway - let the contract handle this validation
    }

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Generate data hash from comment (simplified for demo)
      const encoder = new TextEncoder();
      const data = encoder.encode(feedbackData.comment);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      const dataHash = '0x' + Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');

      // Submit feedback to contract
      const transaction = prepareContractCall({
        contract: reputationContract,
        method: "function submitFeedback(uint256 clientId, uint256 serverId, uint8 score, bytes32 dataHash) external returns (bytes32)",
        params: [
          BigInt(feedbackData.clientId),
          BigInt(feedbackData.serverId),
          feedbackData.score, // Use number directly for uint8, not BigInt
          dataHash as `0x${string}`,
        ],
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Submit feedback transaction successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setSubmissionResult({
            success: true,
            message: "Feedback submitted successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
          });
          
          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');
          
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
        },
        onError: (error) => {
          console.error('Submit feedback transaction failed:', error);
          
          // Handle specific error cases
          let errorMessage = "Failed to submit feedback";
          if (error.message.includes("0x7b221799")) {
            errorMessage = "❌ Feedback already submitted between these agents. Each client can only submit feedback once per server.";
          } else if (error.message.includes("0x49c4c798")) {
            errorMessage = "❌ Feedback already authorized between these agents";
          } else if (error.message.includes("UnauthorizedSender")) {
            errorMessage = "❌ Your address is not whitelisted for feedback submission";
          } else if (error.message.includes("InvalidScore")) {
            errorMessage = "❌ Invalid score. Score must be between 0-100";
          } else if (error.message.includes("AgentNotFound")) {
            errorMessage = "❌ One or both agents not found. Please verify TokenIDs exist.";
          } else if (error.message.includes("FeedbackNotAuthorized")) {
            errorMessage = "❌ Feedback not authorized. Server must first call acceptFeedback()";
          } else if (error.message.includes("UnauthorizedFeedback")) {
            errorMessage = "❌ You must be the owner of the client agent to submit feedback";
          } else {
            errorMessage = `❌ ${error.message}`;
          }
          
          setSubmissionResult({
            success: false,
            message: errorMessage,
          });
        },
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      setSubmissionResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Whitelist Requirements */}
      <Card className="erc-panel">
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#b22c2f] to-[#6f1014]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-white">⚠️ Feedback Submission Requirements</span>
              <div className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-rose-100/80">
                <Mountain className="h-3 w-3 text-rose-100" />
                <span className="font-medium">ERC-8004 Trustless Agent Protocol</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Important requirements for submitting feedback in the ERC-8004 system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="erc-panel-subtle">
            <div className="mb-3 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-rose-200" />
              <span className="font-semibold text-white">Whitelist Required</span>
            </div>
            <p className="mb-3 text-sm text-stone-200">
              <strong>Your wallet address must be whitelisted</strong> to submit feedback in the ERC-8004 ReputationRegistry.
            </p>
            
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-400">Submission Requirements:</p>
              <div className="grid gap-2 text-xs text-stone-200 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    <span>Your address must be whitelisted by an admin</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    <span>Server agent must have authorized your client agent via acceptFeedback()</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    <span>Both client and server agents must exist in IdentityRegistry</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    <span>Score must be between 0-100</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-emerald-300" />
                    <span>No duplicate feedback (one feedback per client-server pair)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-3 text-stone-300 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs uppercase tracking-[0.3em] text-stone-500">Need whitelist access?</span>
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSdE444WHE3jwD9-NigY03ngfQ-A332GrGsRuKUNrxkxpGtG_w/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className="erc-inline-pill bg-gradient-to-r from-[#b22c2f] to-[#6f1014] text-white hover:from-[#c63a3c] hover:to-[#7d1518]"
              >
                <span>📝 Apply for Whitelist</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Agent Lookup Section */}
      <Card className="erc-panel">
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-blue-800">Find Real Agents</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">Live from IdentityRegistry Contract</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Search for actual registered agents by their Token ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter Token ID (e.g., 1, 2, 3...)"
              value={agentLookup.tokenId}
              onChange={(e) => setAgentLookup(prev => ({ ...prev, tokenId: e.target.value }))}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              onClick={handleAgentSearch}
              disabled={agentLookup.isLoading || !agentLookup.tokenId}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {agentLookup.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-blue-800">Search Results:</h4>
              {searchResults.map((agent) => (
                <div key={agent.tokenId} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">#{agent.tokenId} - {agent.domain}</p>
                      <p className="text-xs text-blue-600">Owner: {agent.owner.substring(0, 10)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAcceptFeedbackData(prev => ({ ...prev, agentClientId: agent.tokenId.toString() }));
                          setFeedbackData(prev => ({ ...prev, clientId: agent.tokenId.toString() }));
                        }}
                        className="text-xs bg-blue-50 hover:bg-blue-100"
                      >
                        Use as Client
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAcceptFeedbackData(prev => ({ ...prev, agentServerId: agent.tokenId.toString() }));
                          setFeedbackData(prev => ({ ...prev, serverId: agent.tokenId.toString() }));
                        }}
                        className="text-xs bg-green-50 hover:bg-green-100"
                      >
                        Use as Server
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Feedback Section */}
      <Card className="erc-panel">
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-green-800">Accept Feedback Authorization</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">ERC-8004 Server Role</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            As a Server, authorize specific Client agents to evaluate your services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client Agent ID</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter Token ID or use search above"
                  value={acceptFeedbackData.agentClientId}
                  onChange={(e) => {
                    setAcceptFeedbackData(prev => ({ ...prev, agentClientId: e.target.value }));
                    handleTokenIdLookup(e.target.value);
                    setAcceptFeedbackResult(null); // Clear previous results
                  }}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {acceptFeedbackData.agentClientId && realAgents[acceptFeedbackData.agentClientId] && (
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      #{realAgents[acceptFeedbackData.agentClientId].tokenId} - {realAgents[acceptFeedbackData.agentClientId].domain}
                    </p>
                    <p className="text-xs text-green-600">
                      Owner: {realAgents[acceptFeedbackData.agentClientId].owner.substring(0, 10)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Server Agent ID</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter Token ID or use search above"
                  value={acceptFeedbackData.agentServerId}
                  onChange={(e) => {
                    setAcceptFeedbackData(prev => ({ ...prev, agentServerId: e.target.value }));
                    handleTokenIdLookup(e.target.value);
                    setAcceptFeedbackResult(null); // Clear previous results
                  }}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {acceptFeedbackData.agentServerId && realAgents[acceptFeedbackData.agentServerId] && (
                  <div className="p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-800">
                      #{realAgents[acceptFeedbackData.agentServerId].tokenId} - {realAgents[acceptFeedbackData.agentServerId].domain}
                    </p>
                    <p className="text-xs text-green-600">
                      Owner: {realAgents[acceptFeedbackData.agentServerId].owner.substring(0, 10)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAcceptFeedback}
              disabled={isAcceptingFeedback || isRevokingFeedback || !acceptFeedbackData.agentClientId || !acceptFeedbackData.agentServerId}
              className="flex-1 bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isAcceptingFeedback ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Authorize Feedback
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleRevokeFeedback}
              disabled={isAcceptingFeedback || isRevokingFeedback || !acceptFeedbackData.agentClientId || !acceptFeedbackData.agentServerId}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
            >
              {isRevokingFeedback ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Revoke
                </>
              )}
            </Button>
          </div>

          {/* Accept/Revoke Feedback Result */}
          {acceptFeedbackResult && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              acceptFeedbackResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {acceptFeedbackResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    acceptFeedbackResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {acceptFeedbackResult.type === 'accept' ? 'Authorization' : 'Revocation'} {
                      acceptFeedbackResult.success ? 'Successful' : 'Failed'
                    }
                  </p>
                  <p className={`text-sm ${
                    acceptFeedbackResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {acceptFeedbackResult.message}
                  </p>
                  {acceptFeedbackResult.txHash && acceptFeedbackResult.success && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-600">Transaction Hash:</p>
                      <code className="text-xs bg-white p-2 rounded border break-all block">
                        {acceptFeedbackResult.txHash}
                      </code>
                      {acceptFeedbackResult.snowtraceUrl && (
                        <button
                          onClick={() => window.open(acceptFeedbackResult.snowtraceUrl, '_blank')}
                          className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded hover:from-blue-600 hover:to-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          🔍 View on Snowtrace
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setAcceptFeedbackResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requirements Info */}
      <Card className="erc-panel">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-blue-800">Feedback Submission Requirements</p>
                <Snowflake className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    ✓ Your address must be whitelisted by an admin
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={checkWhitelistStatus}
                    className="text-xs"
                  >
                    Check Status
                  </Button>
                </div>
                {whitelistStatus.isChecked && (
                  <div className={`p-2 rounded text-xs ${whitelistStatus.isWhitelisted ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {whitelistStatus.message}
                  </div>
                )}
                <p className="text-sm text-blue-700">
                  ✓ Server agent must have authorized your client agent via acceptFeedback()
                </p>
                <p className="text-sm text-blue-700">
                  ✓ Both client and server agents must exist in IdentityRegistry
                </p>
                <p className="text-sm text-blue-700">
                  ✓ Score must be between 0-100
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-700">
                    ✓ No duplicate feedback (one feedback per client-server pair)
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={checkFeedbackStatus}
                    className="text-xs"
                  >
                    Check Status
                  </Button>
                </div>
                {feedbackStatus.isChecked && (
                  <div className={`p-2 rounded text-xs ${feedbackStatus.hasAlreadySubmitted ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {feedbackStatus.message}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Mountain className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-blue-600">ERC-8004 Trustless Agent Protocol</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization Step */}
      <Card className="erc-panel">
        <CardHeader className="erc-panel-header">
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
          <CardDescription className="erc-panel-description">
            Confirm evaluation permissions before submitting feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID (Evaluator)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter Token ID or use search above"
                  value={feedbackData.clientId}
                  onChange={(e) => {
                    setFeedbackData(prev => ({ ...prev, clientId: e.target.value }));
                    handleTokenIdLookup(e.target.value);
                    if (feedbackData.serverId) {
                      checkAuthorization(e.target.value, feedbackData.serverId);
                    }
                    // Reset feedback status when IDs change
                    setFeedbackStatus({
                      isChecked: false,
                      hasAlreadySubmitted: false,
                      message: "Click to check feedback status",
                    });
                  }}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {feedbackData.clientId && realAgents[feedbackData.clientId] && (
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                      #{realAgents[feedbackData.clientId].tokenId} - {realAgents[feedbackData.clientId].domain}
                    </p>
                    <p className="text-xs text-red-600">
                      Owner: {realAgents[feedbackData.clientId].owner.substring(0, 10)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Server ID (Evaluation Target)</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Enter Token ID or use search above"
                  value={feedbackData.serverId}
                  onChange={(e) => {
                    setFeedbackData(prev => ({ ...prev, serverId: e.target.value }));
                    handleTokenIdLookup(e.target.value);
                    if (feedbackData.clientId) {
                      checkAuthorization(feedbackData.clientId, e.target.value);
                    }
                    // Reset feedback status when IDs change
                    setFeedbackStatus({
                      isChecked: false,
                      hasAlreadySubmitted: false,
                      message: "Click to check feedback status",
                    });
                  }}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                {feedbackData.serverId && realAgents[feedbackData.serverId] && (
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-sm font-medium text-red-800">
                      #{realAgents[feedbackData.serverId].tokenId} - {realAgents[feedbackData.serverId].domain}
                    </p>
                    <p className="text-xs text-red-600">
                      Owner: {realAgents[feedbackData.serverId].owner.substring(0, 10)}...
                    </p>
                  </div>
                )}
              </div>
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
      <Card className="erc-panel">
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-orange-800">Submit Feedback (Client Role)</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">ERC-8004 Contract Call</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Submit evaluation score and comment to ReputationRegistry contract
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
                <Star className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-red-800">Contract Information</span>
            </div>
            <p className="text-sm text-red-700">
              Submit feedback directly to <strong>ReputationRegistry</strong> contract
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Mountain className="h-3 w-3 text-red-500" />
              <p className="text-xs text-red-600">
                Gas fee required for blockchain transaction
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
                Submitting feedback...
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-2" />
                Submit feedback to contract
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Submission Result */}
      {submissionResult && (
        <Card className={`erc-panel ${submissionResult.success ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
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
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-green-600">Transaction Hash:</p>
                    <code className="text-xs bg-white p-1 rounded border break-all block">
                      {submissionResult.txHash}
                    </code>
                    {submissionResult.snowtraceUrl && (
                      <button
                        onClick={() => window.open(submissionResult.snowtraceUrl, '_blank')}
                        className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded hover:from-blue-600 hover:to-blue-700 transition-colors"
                      >
                        🔍 View on Snowtrace
                      </button>
                    )}
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
