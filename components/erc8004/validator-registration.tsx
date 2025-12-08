"use client";

import { useState, useEffect } from "react";
import { createThirdwebClient, getContract, prepareContractCall, readContract } from "thirdweb";
import { useActiveWallet, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Star, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Mountain, 
  Snowflake, 
  Search,
  TrendingUp,
  Award,
  MessageSquare,
  Send,
  Clock,
  FileText
} from "lucide-react";
import { avalancheFuji } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses (Fuji Testnet)
const VALIDATION_REGISTRY_ADDRESS = "0x488b53ef50aeB8ae97dE7Bb31C06Fa5e8024ed94";
const IDENTITY_REGISTRY_ADDRESS = "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29";

const validationContract = getContract({
  client,
  chain: avalancheFuji,
  address: VALIDATION_REGISTRY_ADDRESS,
});

const identityContract = getContract({
  client,
  chain: avalancheFuji,
  address: IDENTITY_REGISTRY_ADDRESS,
});

// Minimum validator stake: 0.1 AVAX
const MIN_VALIDATOR_STAKE = BigInt("100000000000000000");

// Error signature mapping for better error handling
const ERROR_SIGNATURES = {
  "0xe93ba223": "UnknownValidationError",
  // Remove specific unknown error mappings
} as const;

// Helper function to identify error type
const identifyValidatorError = (errorMessage: string) => {
  // Check for known error signatures
  const signature = errorMessage.match(/0x[a-fA-F0-9]{8}/)?.[0];
  if (signature && ERROR_SIGNATURES[signature as keyof typeof ERROR_SIGNATURES]) {
    return ERROR_SIGNATURES[signature as keyof typeof ERROR_SIGNATURES];
  }
  
  // Check for error names
  if (errorMessage.includes("AgentNotFound")) return "AgentNotFound";
  if (errorMessage.includes("ValidationRequestNotFound")) return "ValidationRequestNotFound";
  if (errorMessage.includes("UnauthorizedValidator")) return "UnauthorizedValidator";
  if (errorMessage.includes("ValidationAlreadyResponded")) return "ValidationAlreadyResponded";
  if (errorMessage.includes("RequestExpired")) return "RequestExpired";
  if (errorMessage.includes("InvalidResponse")) return "InvalidResponse";
  if (errorMessage.includes("user rejected")) return "UserRejected";
  if (errorMessage.includes("insufficient funds")) return "InsufficientFunds";
  
  return "Unknown";
};

interface ValidatorInfo {
  validatorId: number;
  stakedAmount: string;
  isActive: boolean;
  validationsCompleted: number;
  successRate: number;
}

interface RealAgent {
  tokenId: number;
  domain: string;
  cardURI: string;
  owner: string;
  exists: boolean;
}

interface ValidationRequest {
  dataHash: string;
  agentValidatorId: number;
  agentServerId: number;
  reward: string;
  timestamp: number;
  responded: boolean;
}

interface ValidationResponseForm {
  dataHash: string;
  response: string; // 0-100 score
}

export function ValidatorRegistration() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const [formData, setFormData] = useState({
    validatorId: "",
    stakeAmount: "0.1", // Default minimum stake
  });

  // State for agent lookup
  const [agentLookup, setAgentLookup] = useState({
    tokenId: "",
    isLoading: false,
  });
  const [realAgents, setRealAgents] = useState<{ [key: string]: RealAgent }>({});
  const [searchResults, setSearchResults] = useState<RealAgent[]>([]);
  
  const [isStaking, setIsStaking] = useState(false);
  const [validatorInfo, setValidatorInfo] = useState<ValidatorInfo | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [stakingResult, setStakingResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
    snowtraceUrl?: string;
    type: 'stake' | 'unstake';
  } | null>(null);
  
  // Validation Response state
  const [responseForm, setResponseForm] = useState<ValidationResponseForm>({
    dataHash: "",
    response: "",
  });
  
  const [activeTab, setActiveTab] = useState<"staking" | "response">("staking");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ValidationRequest[]>([]);
  
  const [responseResult, setResponseResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
    snowtraceUrl?: string;
  } | null>(null);

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

  // Look up validator info for a given agent
  const lookupValidatorInfo = async (validatorId: string) => {
    if (!validatorId || validatorId.trim() === "") {
      setValidatorInfo(null);
      return;
    }

    try {
      // Get validator active status
      const isActive = await readContract({
        contract: validationContract,
        method: "function isValidatorActive(uint256 validatorId) external view returns (bool)",
        params: [BigInt(validatorId)],
      });

      // Get validator stake info
      const [stakedAmount] = await readContract({
        contract: validationContract,
        method: "function getValidatorStake(uint256 validatorId) external view returns (uint256 staked, uint256 locked, uint256 available)",
        params: [BigInt(validatorId)],
      });

      const validator: ValidatorInfo = {
        validatorId: parseInt(validatorId),
        stakedAmount: (stakedAmount as bigint).toString(),
        isActive: isActive as boolean,
        validationsCompleted: 0, // This info would need a separate tracking mechanism
        successRate: 100, // Default success rate
      };

      setValidatorInfo(validator);
    } catch (error) {
      console.error('Error looking up validator info:', error);
      // Validator not registered yet
      setValidatorInfo(null);
    }
  };

  // Handle validator info lookup when ID changes
  useEffect(() => {
    if (formData.validatorId && realAgents[formData.validatorId]) {
      const timeoutId = setTimeout(() => {
        lookupValidatorInfo(formData.validatorId);
      }, 500); // Debounce lookup

      return () => clearTimeout(timeoutId);
    } else {
      setValidatorInfo(null);
    }
  }, [formData.validatorId, realAgents]);

  const validateStakeAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.1) {
      return "Minimum stake amount is 0.1 AVAX";
    }
    return null;
  };

  const handleStakeAsValidator = async () => {
    if (!wallet || !account) {
      setErrors({ general: "Please connect your wallet" });
      return;
    }

    // Validate inputs
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.validatorId) {
      newErrors.validatorId = "Validator ID is required";
    }

    const stakeError = validateStakeAmount(formData.stakeAmount);
    if (stakeError) {
      newErrors.stakeAmount = stakeError;
    }

    const currentAgent = realAgents[formData.validatorId];
    if (!currentAgent) {
      newErrors.validatorId = "Please enter a valid agent ID";
    } else if (currentAgent.owner.toLowerCase() !== account.address.toLowerCase()) {
      newErrors.validatorId = `⚠️ You don't own this agent. Only the owner (${currentAgent.owner.substring(0, 10)}...) can stake for this validator. This ensures security and proper reward distribution.`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsStaking(true);
    setErrors({});
    setStakingResult(null);

    try {
      // Double-check agent exists before staking
      const agentExists = await readContract({
        contract: identityContract,
        method: "function agentExists(uint256 tokenId) external view returns (bool)",
        params: [BigInt(formData.validatorId)],
      });

      if (!agentExists) {
        throw new Error("Agent does not exist in IdentityRegistry");
      }

      // Verify ownership again
      const [, , agentOwner] = await readContract({
        contract: identityContract,
        method: "function getAgent(uint256 tokenId) external view returns (uint256, string memory, address, string memory)",
        params: [BigInt(formData.validatorId)],
      });

      if (agentOwner.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error("Not agent owner - ownership changed");
      }

      const stakeAmountWei = BigInt(Math.floor(parseFloat(formData.stakeAmount) * 1e18).toString());

      const transaction = prepareContractCall({
        contract: validationContract,
        method: "function stakeAsValidator(uint256 validatorId) external payable",
        params: [BigInt(formData.validatorId)],
        value: stakeAmountWei,
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Stake transaction successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setStakingResult({
            success: true,
            message: validatorInfo ? "Additional stake added successfully!" : "Validator registration completed successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
            type: 'stake',
          });

          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');

          // Refresh validator info
          lookupValidatorInfo(formData.validatorId);

          // Reset form
          setFormData({ validatorId: "", stakeAmount: "0.1" });
        },
        onError: (error) => {
          console.error('Stake transaction failed:', error);
          
          let errorMessage = "Failed to stake as validator";
          
          // Handle specific error signatures
          if (error.message.includes("0xe93ba223")) {
            errorMessage = "❌ Contract error - please check network connection and try again.";
          } else if (error.message.includes("0x2b370b60")) { // AgentNotFound selector
            errorMessage = "❌ Agent not found. Please verify the agent ID exists.";
          } else if (error.message.includes("Not validator owner")) {
            errorMessage = "❌ You must be the owner of this agent to register it as a validator.";
          } else if (error.message.includes("Insufficient initial stake")) {
            errorMessage = "❌ Insufficient stake amount. Minimum is 0.1 AVAX for new validators.";
          } else if (error.message.includes("AgentNotFound")) {
            errorMessage = "❌ Agent not found. Please verify the agent ID exists.";
          } else if (error.message.includes("user rejected")) {
            errorMessage = "❌ Transaction rejected by user.";
          } else if (error.message.includes("insufficient funds")) {
            errorMessage = "❌ Insufficient AVAX balance for transaction.";
          }
          
          setStakingResult({
            success: false,
            message: `${errorMessage}: ${error.message}`,
            type: 'stake',
          });
        },
      });
    } catch (error) {
      console.error('Staking error:', error);
      
      let errorMessage = "Failed to prepare staking transaction";
      if (error instanceof Error) {
        if (error.message.includes("Agent does not exist")) {
          errorMessage = "❌ Agent not found in registry. Please verify the Token ID.";
        } else if (error.message.includes("Not agent owner")) {
          errorMessage = "❌ You are no longer the owner of this agent.";
        } else if (error.message.includes("0xe93ba223")) {
          errorMessage = "❌ Contract validation failed. Please check your inputs and try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setStakingResult({
        success: false,
        message: errorMessage,
        type: 'stake',
      });
    } finally {
      setIsStaking(false);
    }
  };

  // Handle validation response
  const handleValidationResponse = async () => {
    if (!wallet || !account) {
      setErrors({ general: "Please connect your wallet" });
      return;
    }

    // Validate inputs
    const newErrors: { [key: string]: string } = {};
    
    if (!responseForm.dataHash) {
      newErrors.dataHash = "Data hash is required";
    }

    if (!responseForm.response) {
      newErrors.response = "Response score is required";
    } else {
      const score = parseInt(responseForm.response);
      if (isNaN(score) || score < 0 || score > 100) {
        newErrors.response = "Response score must be between 0 and 100";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmittingResponse(true);
    setErrors({});
    setResponseResult(null);

    try {
      const transaction = prepareContractCall({
        contract: validationContract,
        method: "function validationResponse(bytes32 dataHash, uint8 response) external",
        params: [responseForm.dataHash as `0x${string}`, parseInt(responseForm.response)],
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Validation response successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setResponseResult({
            success: true,
            message: "Validation response submitted successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
          });

          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');

          // Reset form
          setResponseForm({ dataHash: "", response: "" });
        },
        onError: (error) => {
          console.error('Validation response failed:', error);
          
          let errorMessage = "Failed to submit validation response";
          
          if (error.message.includes("ValidationRequestNotFound")) {
            errorMessage = "❌ Validation request not found for this data hash.";
          } else if (error.message.includes("UnauthorizedValidator")) {
            errorMessage = "❌ You are not authorized to respond to this validation request.";
          } else if (error.message.includes("ValidationAlreadyResponded")) {
            errorMessage = "❌ This validation request has already been responded to.";
          } else if (error.message.includes("RequestExpired")) {
            errorMessage = "❌ This validation request has expired.";
          } else if (error.message.includes("InvalidResponse")) {
            errorMessage = "❌ Invalid response score. Must be between 0 and 100.";
          } else if (error.message.includes("user rejected")) {
            errorMessage = "❌ Transaction rejected by user.";
          }
          
          setResponseResult({
            success: false,
            message: `${errorMessage}: ${error.message}`,
          });
        },
      });
    } catch (error) {
      console.error('Validation response error:', error);
      
      let errorMessage = "Failed to prepare validation response";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setResponseResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const currentAgent = realAgents[formData.validatorId];
  const isFormValid = formData.validatorId && formData.stakeAmount && currentAgent && currentAgent.owner.toLowerCase() === account?.address.toLowerCase() && Object.keys(errors).length === 0;
  
  const isResponseFormValid = responseForm.dataHash && responseForm.response && 
                             !isNaN(parseInt(responseForm.response)) &&
                             parseInt(responseForm.response) >= 0 && parseInt(responseForm.response) <= 100;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card className="erc-panel">
        <CardContent className="p-4">
          <div className="flex space-x-1">
            <Button
              variant={activeTab === "staking" ? "default" : "outline"}
              onClick={() => setActiveTab("staking")}
              className={`flex-1 ${
                activeTab === "staking"
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                  : "border-purple-300 text-purple-700 hover:bg-purple-50"
              }`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Validator Staking
            </Button>
            <Button
              variant={activeTab === "response" ? "default" : "outline"}
              onClick={() => setActiveTab("response")}
              className={`flex-1 ${
                activeTab === "response"
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                  : "border-purple-300 text-purple-700 hover:bg-purple-50"
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Validation Response
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Validator Staking Tab */}
      {activeTab === "staking" && (
      <Card>
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl text-purple-800">Validator Registration</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-600">ERC-8004 Validation Network</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Stake AVAX to become a validator and earn rewards for verifying agent data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Real Agent Lookup Section */}
          <Card className="erc-panel">
            <CardHeader className="erc-panel-header">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-blue-800">Find Your Agent</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mountain className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Live from IdentityRegistry Contract</span>
                  </div>
                </div>
              </CardTitle>
              <CardDescription className="erc-panel-description">
                Search for your registered agent by Token ID to register as validator
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
                          {agent.owner.toLowerCase() === account?.address.toLowerCase() ? (
                            <Badge className="mt-1 bg-green-100 text-green-800">✅ You own this agent</Badge>
                          ) : (
                            <Badge variant="destructive" className="mt-1">❌ You don't own this agent</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, validatorId: agent.tokenId.toString() }));
                              setStakingResult(null);
                            }}
                            disabled={agent.owner.toLowerCase() !== account?.address.toLowerCase()}
                            className={`text-xs ${
                              agent.owner.toLowerCase() === account?.address.toLowerCase()
                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300'
                                : 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {agent.owner.toLowerCase() === account?.address.toLowerCase() 
                              ? 'Use as Validator' 
                              : 'Not Owner'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validator ID Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Agent ID (Validator)</label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Enter Token ID or use search above"
                value={formData.validatorId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, validatorId: e.target.value }));
                  handleTokenIdLookup(e.target.value);
                  setStakingResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              {errors.validatorId && (
                <p className="text-red-600 text-sm">{errors.validatorId}</p>
              )}
              {formData.validatorId && realAgents[formData.validatorId] && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="font-medium text-purple-900">#{realAgents[formData.validatorId].tokenId} - {realAgents[formData.validatorId].domain}</p>
                  <p className="text-sm text-purple-700">Owner: {realAgents[formData.validatorId].owner}</p>
                  {realAgents[formData.validatorId].owner.toLowerCase() === account?.address.toLowerCase() ? (
                    <Badge className="mt-1 bg-green-100 text-green-800">✅ You own this agent</Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-1">❌ You don't own this agent</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stake Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Stake Amount (AVAX)</label>
            <div className="space-y-2">
              <input
                type="number"
                step="0.01"
                min="0.1"
                placeholder="0.1"
                value={formData.stakeAmount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, stakeAmount: e.target.value }));
                  setStakingResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              {errors.stakeAmount && (
                <p className="text-red-600 text-sm">{errors.stakeAmount}</p>
              )}
              <p className="text-xs text-gray-500">
                Minimum stake: 0.1 AVAX. Higher stakes may increase validation assignment probability.
              </p>
            </div>
          </div>

          {/* Current Validator Info */}
          {validatorInfo && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3">Current Validator Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">
                    {validatorInfo.isActive ? "Active" : "Inactive"}
                  </div>
                  <div className="text-xs text-purple-600">Status</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">
                    {(parseFloat(validatorInfo.stakedAmount) / 1e18).toFixed(3)} AVAX
                  </div>
                  <div className="text-xs text-purple-600">Staked</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">{validatorInfo.validationsCompleted}</div>
                  <div className="text-xs text-purple-600">Validations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-700">{validatorInfo.successRate}%</div>
                  <div className="text-xs text-purple-600">Success Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleStakeAsValidator}
            disabled={!isFormValid || isStaking}
            className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isStaking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {validatorInfo ? "Adding Stake..." : "Registering Validator..."}
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {validatorInfo ? `Add Stake (${formData.stakeAmount} AVAX)` : `Stake as Validator (${formData.stakeAmount} AVAX)`}
              </>
            )}
          </Button>

          {/* Staking Result */}
          {stakingResult && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              stakingResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {stakingResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    stakingResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Validator {stakingResult.success ? 'Registration Successful' : 'Registration Failed'}
                  </p>
                  <p className={`text-sm ${
                    stakingResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {stakingResult.message}
                  </p>
                  {stakingResult.txHash && stakingResult.success && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-600">Transaction Hash:</p>
                      <code className="text-xs bg-white p-2 rounded border break-all block">
                        {stakingResult.txHash}
                      </code>
                      {stakingResult.snowtraceUrl && (
                        <button
                          onClick={() => window.open(stakingResult.snowtraceUrl, '_blank')}
                          className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded hover:from-blue-600 hover:to-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          🔍 View on Snowtrace
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setStakingResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Validation Response Tab */}
      {activeTab === "response" && (
      <Card>
        <CardHeader className="erc-panel-header">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl text-emerald-800">Validation Response</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-600">Respond to Validation Requests</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Review and respond to validation requests with your expert assessment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Data Hash Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Data Hash</label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter data hash to validate (0x...)"
                value={responseForm.dataHash}
                onChange={(e) => {
                  setResponseForm(prev => ({ ...prev, dataHash: e.target.value }));
                  setResponseResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
              />
              {errors.dataHash && (
                <p className="text-red-600 text-sm">{errors.dataHash}</p>
              )}
              <p className="text-xs text-gray-500">
                The data hash from the validation request you want to respond to
              </p>
            </div>
          </div>

          {/* Response Score Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Quality Score (0-100)</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={responseForm.response || "0"}
                  onChange={(e) => {
                    setResponseForm(prev => ({ ...prev, response: e.target.value }));
                    setResponseResult(null);
                    setErrors({});
                  }}
                  className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="min-w-[60px] text-center">
                  <div className="text-lg font-bold text-emerald-800">{responseForm.response || "0"}</div>
                  <div className="text-xs text-emerald-600">Score</div>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Enter score (0-100)"
                value={responseForm.response}
                onChange={(e) => {
                  const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                  setResponseForm(prev => ({ ...prev, response: value.toString() }));
                  setResponseResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.response && (
                <p className="text-red-600 text-sm">{errors.response}</p>
              )}
              <div className="flex justify-between text-xs text-emerald-600">
                <span>0: Poor Quality</span>
                <span>50: Average Quality</span>
                <span>100: Excellent Quality</span>
              </div>
            </div>
          </div>

          {/* Score Guidelines */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h4 className="font-medium text-emerald-800">Scoring Guidelines</h4>
              </div>
              <div className="space-y-2 text-sm text-emerald-700">
                <div className="flex justify-between">
                  <span>90-100:</span>
                  <span>Exceptional quality, exceeds standards</span>
                </div>
                <div className="flex justify-between">
                  <span>70-89:</span>
                  <span>Good quality, meets requirements</span>
                </div>
                <div className="flex justify-between">
                  <span>50-69:</span>
                  <span>Acceptable quality, minor issues</span>
                </div>
                <div className="flex justify-between">
                  <span>30-49:</span>
                  <span>Below average, significant issues</span>
                </div>
                <div className="flex justify-between">
                  <span>0-29:</span>
                  <span>Poor quality, major problems</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleValidationResponse}
            disabled={!isResponseFormValid || isSubmittingResponse}
            className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-emerald-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmittingResponse ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Response...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Validation Response (Score: {responseForm.response || "0"})
              </>
            )}
          </Button>

          {/* Response Result */}
          {responseResult && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              responseResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {responseResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    responseResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Validation Response {responseResult.success ? 'Submitted' : 'Failed'}
                  </p>
                  <p className={`text-sm ${
                    responseResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {responseResult.message}
                  </p>
                  {responseResult.txHash && responseResult.success && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-600">Transaction Hash:</p>
                      <code className="text-xs bg-white p-2 rounded border break-all block">
                        {responseResult.txHash}
                      </code>
                      {responseResult.snowtraceUrl && (
                        <button
                          onClick={() => window.open(responseResult.snowtraceUrl, '_blank')}
                          className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded hover:from-blue-600 hover:to-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          🔍 View on Snowtrace
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setResponseResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Requirements Info */}
      <Card className="erc-panel">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-purple-800">Validator Requirements</p>
                <Snowflake className="h-4 w-4 text-purple-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-purple-700">
                  ✓ Must own an agent registered in IdentityRegistry
                </p>
                <p className="text-sm text-purple-700">
                  ✓ Minimum stake: 0.1 AVAX (can add more anytime)
                </p>
                <p className="text-sm text-purple-700">
                  ✓ Earn rewards for completing validation requests
                </p>
                <p className="text-sm text-purple-700">
                  ⚠️ Risk: 10% slash penalty for non-responsive validators
                </p>
                <p className="text-xs text-purple-600 mt-2 italic">
                  💡 Ownership requirement ensures validator security and reward distribution
                </p>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Mountain className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-600">ERC-8004 Trustless Validation Protocol</span>
              </div>
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-700 mb-2">
                  <strong>Don't have an agent yet?</strong>
                </p>
                <p className="text-xs text-purple-600">
                  You need to register an agent first in the "Register" tab before becoming a validator.
                  Only agent owners can stake and operate validators to ensure security and accountability.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Info */}
      <Card className="erc-panel">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-indigo-800">Validator Benefits</p>
                <TrendingUp className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-indigo-700">
                  💰 Earn validation rewards (minimum 0.001 ETH per validation)
                </p>
                <p className="text-sm text-indigo-700">
                  📈 Build reputation through successful validations
                </p>
                <p className="text-sm text-indigo-700">
                  🔒 Your stake earns network participation rewards
                </p>
                <p className="text-sm text-indigo-700">
                  🚀 Higher stakes may get priority for validation assignments
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}