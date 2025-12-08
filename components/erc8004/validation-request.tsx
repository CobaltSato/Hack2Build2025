"use client";

import { useState } from "react";
import { createThirdwebClient, getContract, prepareContractCall, readContract } from "thirdweb";
import { useActiveWallet, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileSearch, 
  Shield, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Mountain, 
  Search,
  Send,
  Award,
  User
} from "lucide-react";
import { avalancheFuji } from "thirdweb/chains";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses (Fuji Testnet)
const VALIDATION_REGISTRY_ADDRESS = "0x488b53ef50aeB8ae97dE7Bb31C06Fa5e8024ed94";
const IDENTITY_REGISTRY_ADDRESS = "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29";

// Use standard contract without custom ABI to avoid type issues
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

// Removed unused constants

// Error signature mapping for better error handling
const ERROR_SIGNATURES: Record<string, "AgentNotFound" | "InvalidDataHash" | "InsufficientReward" | "ValidatorNotActive"> = {
  "0xe93ba223": "AgentNotFound",
  "0xee3e17dc": "InvalidDataHash",
  "0xd77b6db6": "InsufficientReward",
  "0xa6ce15f6": "ValidatorNotActive",
};

const extractErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const maybeMsg = (error as { message?: string }).message;
    if (maybeMsg) return maybeMsg;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unrecognized error";
    }
  }
  return String(error);
};

// Helper function to identify error type
const identifyError = (errorMessage: string) => {
  // Check for known error signatures first
  const signature = errorMessage.match(/0x[a-fA-F0-9]{8}/)?.[0];
  if (signature && ERROR_SIGNATURES[signature]) {
    return ERROR_SIGNATURES[signature];
  }
  
  // For unknown error signatures, return a generic error type
  if (signature && signature === "0xbeab6e29") {
    return "ValidationError";
  }
  
  // Check for error names
  if (errorMessage.includes("ValidationError") || 
      errorMessage.includes("UnauthorizedAccess")) {
    return "ValidationError";
  }
  
  if (errorMessage.includes("AgentNotFound")) return "AgentNotFound";
  if (errorMessage.includes("ValidatorNotActive")) return "ValidatorNotActive";
  if (errorMessage.includes("InsufficientReward")) return "InsufficientReward";
  if (errorMessage.includes("InvalidDataHash")) return "InvalidDataHash";
  if (errorMessage.includes("user rejected")) return "UserRejected";
  if (errorMessage.includes("insufficient funds")) return "InsufficientFunds";
  
  return "Unknown";
};

interface RealAgent {
  tokenId: number;
  domain: string;
  cardURI: string;
  owner: string;
  exists: boolean;
}

interface ValidationRequestForm {
  validatorId: string;
  serverId: string;
  dataHash: string;
  rewardAmount: string;
  originalData: string;
}

export function ValidationRequest() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const { mutate: sendTransaction } = useSendTransaction();

  const [formData, setFormData] = useState<ValidationRequestForm>({
    validatorId: "",
    serverId: "",
    dataHash: "",
    rewardAmount: "0.001", // Default minimum reward
    originalData: "",
  });

  // State for agent lookup
  const [agentLookup, setAgentLookup] = useState({
    tokenId: "",
    isLoading: false,
    type: "" as "validator" | "server" | "",
  });
  
  const [realAgents, setRealAgents] = useState<{ [key: string]: RealAgent }>({});
  const [searchResults, setSearchResults] = useState<RealAgent[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [requestResult, setRequestResult] = useState<{
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
      const [, domain, owner, cardURI] = await readContract({
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

  const ensureValidatorIsActive = async (validatorId: string) => {
    try {
      const isActive = await readContract({
        contract: validationContract,
        method: "function isValidatorActive(uint256 validatorId) external view returns (bool)",
        params: [BigInt(validatorId)],
      });

      return Boolean(isActive);
    } catch (error) {
      console.error("Validator status lookup failed:", error);
      throw new Error("Unable to verify validator status. Please try again.");
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
  const handleTokenIdLookup = async (tokenId: string, _type: "validator" | "server") => {
    if (tokenId && tokenId.trim() !== "" && !realAgents[tokenId]) {
      await lookupAgent(tokenId);
    }
  };

  // Generate data hash and call server API for signature
  const generateDataHash = async () => {
    if (!formData.originalData.trim()) {
      alert("Please enter original data");
      return;
    }

    if (!formData.validatorId || !formData.serverId) {
      alert("Please enter both Validator ID and Server ID first");
      return;
    }

    try {
      // Call server API to process validation request
      const response = await fetch('/api/validation-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalData: formData.originalData,
          validatorId: formData.validatorId,
          serverId: formData.serverId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process validation request');
      }

      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({ ...prev, dataHash: result.dataHash }));
        console.log('Server verification completed:', {
          dataHash: result.dataHash,
          messageHash: result.messageHash,
          timestamp: result.timestamp
        });
      } else {
        throw new Error(result.error || 'Server processing failed');
      }
    } catch (error) {
      console.error('Hash generation error:', error);
      alert('Failed to generate hash: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const validateRewardAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.001) {
      return "Minimum reward amount is 0.001 AVAX";
    }
    return null;
  };

  const handleValidationRequest = async () => {
    if (!wallet || !account) {
      setErrors({ general: "Please connect your wallet" });
      return;
    }

    setIsSubmitting(true);

    // Validate inputs
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.validatorId) {
      newErrors.validatorId = "Validator ID is required";
    }

    if (!formData.serverId) {
      newErrors.serverId = "Server ID is required";
    }

    if (!formData.dataHash) {
      newErrors.dataHash = "Data hash is required";
    }

    const rewardError = validateRewardAmount(formData.rewardAmount);
    if (rewardError) {
      newErrors.rewardAmount = rewardError;
    }

    const validatorAgent = realAgents[formData.validatorId];
    if (!validatorAgent) {
      newErrors.validatorId = "Please enter a valid validator agent ID";
    }

    const serverAgent = realAgents[formData.serverId];
    if (!serverAgent) {
      newErrors.serverId = "Please enter a valid server agent ID";
    } else if (serverAgent.owner.toLowerCase() !== account.address.toLowerCase()) {
      newErrors.serverId = `⚠️ You don't own this server agent. Only the owner (${serverAgent.owner.substring(0, 10)}...) can request validation for this agent.`;
    }

    if (!newErrors.validatorId && formData.validatorId) {
      try {
        const validatorActive = await ensureValidatorIsActive(formData.validatorId);
        if (!validatorActive) {
          const inactiveMessage = "Selected validator is not active. Ask the validator to stake at least 0.1 AVAX in the Validation tab before requesting.";
          newErrors.validatorId = inactiveMessage;
          newErrors.general = inactiveMessage;
        }
      } catch (statusError) {
        const message = statusError instanceof Error ? statusError.message : "Unable to verify validator status.";
        newErrors.validatorId = message;
        newErrors.general = message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});
    setRequestResult(null);

    try {
      // Double-check agents exist
      const validatorExists = await readContract({
        contract: identityContract,
        method: "function agentExists(uint256 tokenId) external view returns (bool)",
        params: [BigInt(formData.validatorId)],
      });

      const serverExists = await readContract({
        contract: identityContract,
        method: "function agentExists(uint256 tokenId) external view returns (bool)",
        params: [BigInt(formData.serverId)],
      });

      if (!validatorExists) {
        throw new Error("Validator agent does not exist");
      }

      if (!serverExists) {
        throw new Error("Server agent does not exist");
      }

      const rewardAmountWei = BigInt(Math.floor(parseFloat(formData.rewardAmount) * 1e18).toString());

      // Call server API to get signed data hash
      const apiResponse = await fetch('/api/validation-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalData: formData.originalData,
          validatorId: formData.validatorId,
          serverId: formData.serverId,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to get signed validation request from server');
      }

      const apiResult = await apiResponse.json();
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Server validation failed');
      }

      // Use server-provided signature
      console.log('Server API response:', apiResult);
      
      if (!apiResult.signature) {
        throw new Error('No signature received from server');
      }

      const transaction = prepareContractCall({
        contract: validationContract,
        method: "function validationRequest(uint256 agentValidatorId, uint256 agentServerId, bytes32 dataHash, bytes calldata signature) external payable",
        params: [BigInt(formData.validatorId), BigInt(formData.serverId), apiResult.dataHash as `0x${string}`, apiResult.signature],
        value: rewardAmountWei,
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Validation request successful:', result);
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          
          setRequestResult({
            success: true,
            message: "Validation request submitted successfully!",
            txHash: result.transactionHash,
            snowtraceUrl: snowtraceUrl,
          });

          // Open Snowtrace link in new tab
          window.open(snowtraceUrl, '_blank');

          // Reset form
          setFormData({ validatorId: "", serverId: "", dataHash: "", rewardAmount: "0.001", originalData: "" });
        },
        onError: (error) => {
          const friendlyMessage = extractErrorMessage(error);
          console.error('Validation request failed:', friendlyMessage, error);
          
          let errorMessage = "Failed to submit validation request";
          
          // Handle errors using helper function
          const errorType = identifyError(friendlyMessage);
          
          switch (errorType) {
            case "ValidationError":
              errorMessage = "❌ Validation error occurred. Please check your input.";
              break;
            case "AgentNotFound":
              errorMessage = "❌ Agent not found. Please check the Agent ID.";
              break;
            case "ValidatorNotActive":
              errorMessage = "❌ Selected validator is not active. Please select an active validator.";
              break;
            case "InsufficientReward":
              errorMessage = "❌ Insufficient reward amount. Minimum 0.001 AVAX required.";
              break;
            case "InvalidDataHash":
              errorMessage = "❌ Invalid data hash format.";
              break;
            case "UserRejected":
              errorMessage = "❌ Transaction rejected by user.";
              break;
            case "InsufficientFunds":
              errorMessage = "❌ Insufficient AVAX balance.";
              break;
            default:
              if (friendlyMessage.includes("AbiErrorSignatureNotFoundError")) {
                errorMessage = "❌ Contract error: Unknown validation rule. Please check your input.";
              } else {
                errorMessage = "❌ Failed to submit validation request.";
              }
              break;
          }
          
          setRequestResult({
            success: false,
            message: errorMessage,
          });

          // Development debugging information
          if (process.env.NODE_ENV === 'development') {
            console.error('Full error details for debugging:', {
              errorMessage: friendlyMessage,
              errorCode: friendlyMessage.match(/0x[a-fA-F0-9]{8}/)?.[0],
              stack: error instanceof Error ? error.stack : undefined,
            });
          }
        },
      });
    } catch (error) {
      console.error('Validation request error:', error);
      
      let errorMessage = "Failed to prepare validation request";
      if (error instanceof Error) {
        if (error.message.includes("does not exist")) {
          errorMessage = "❌ Agent not found. Please check the Token ID.";
        } else {
          const errorType = identifyError(error.message);
          
          switch (errorType) {
            case "ValidationError":
              errorMessage = "❌ Validation error occurred. Please check your input.";
              break;
            case "AgentNotFound":
              errorMessage = "❌ Agent not found. Please check the Agent ID.";
              break;
            default:
              if (error.message.includes("AbiErrorSignatureNotFoundError")) {
                errorMessage = "❌ Contract error: Unknown validation rule. Please check your input.";
              } else {
                errorMessage = `❌ Error: ${error.message}`;
              }
              break;
          }
        }
      }
      
      setRequestResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.validatorId && formData.serverId && formData.dataHash && formData.rewardAmount && 
                     realAgents[formData.validatorId] && realAgents[formData.serverId] && 
                     realAgents[formData.serverId].owner.toLowerCase() === account?.address.toLowerCase() &&
                     Object.keys(errors).length === 0;

  return (
    <div className="space-y-6">
      {/* Validation Request Form */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-b border-green-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <FileSearch className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl text-green-800">Validation Request</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Request Validation from Expert Validators</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-green-700">
            Submit data for validation by expert validators and earn quality assurance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Agent Lookup Section */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border-b border-blue-200">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-blue-800">Find Agents</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mountain className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Search by Token ID</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Enter Token ID to search..."
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
                            <Badge variant="secondary" className="mt-1">👤 Other owner</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, validatorId: agent.tokenId.toString() }));
                              setRequestResult(null);
                            }}
                            className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-300"
                          >
                            Use as Validator
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, serverId: agent.tokenId.toString() }));
                              setRequestResult(null);
                            }}
                            disabled={agent.owner.toLowerCase() !== account?.address.toLowerCase()}
                            className={`text-xs ${
                              agent.owner.toLowerCase() === account?.address.toLowerCase()
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300'
                                : 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {agent.owner.toLowerCase() === account?.address.toLowerCase() 
                              ? 'Use as Server' 
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
            <label className="block text-sm font-medium mb-2">Validator Agent ID</label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Enter Validator Token ID"
                value={formData.validatorId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, validatorId: e.target.value }));
                  handleTokenIdLookup(e.target.value, "validator");
                  setRequestResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.validatorId && (
                <p className="text-red-600 text-sm">{errors.validatorId}</p>
              )}
              {formData.validatorId && realAgents[formData.validatorId] && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-900">#{realAgents[formData.validatorId].tokenId} - {realAgents[formData.validatorId].domain}</p>
                  <p className="text-sm text-green-700">Owner: {realAgents[formData.validatorId].owner}</p>
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Validator Agent
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Server ID Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Server Agent ID (Your Agent)</label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Enter Server Token ID"
                value={formData.serverId}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, serverId: e.target.value }));
                  handleTokenIdLookup(e.target.value, "server");
                  setRequestResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.serverId && (
                <p className="text-red-600 text-sm">{errors.serverId}</p>
              )}
              {formData.serverId && realAgents[formData.serverId] && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">#{realAgents[formData.serverId].tokenId} - {realAgents[formData.serverId].domain}</p>
                  <p className="text-sm text-blue-700">Owner: {realAgents[formData.serverId].owner}</p>
                  {realAgents[formData.serverId].owner.toLowerCase() === account?.address.toLowerCase() ? (
                    <Badge className="mt-1 bg-green-100 text-green-800">
                      <User className="h-3 w-3 mr-1" />
                      ✅ You own this agent
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-1">❌ You don't own this agent</Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Original Data Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Original Data</label>
            <div className="space-y-2">
              <textarea
                placeholder="Enter data to be validated&#10;Examples:&#10;- AI response results&#10;- Analysis reports&#10;- Code&#10;- JSON format data&#10;- Other validation target data"
                value={formData.originalData}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, originalData: e.target.value }));
                  setRequestResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                rows={6}
              />
              <p className="text-xs text-gray-500">
                🔍 This data will be validated by validators (quality assessment, accuracy verification, etc.)
              </p>
            </div>
          </div>

          {/* Data Hash Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Data Hash</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Generate hash from original data (0x...)"
                  value={formData.dataHash}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, dataHash: e.target.value }));
                    setRequestResult(null);
                    setErrors({});
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                  readOnly
                />
                <Button
                  onClick={generateDataHash}
                  type="button"
                  disabled={!formData.originalData.trim() || !formData.validatorId || !formData.serverId}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  🔐 Generate Hash
                </Button>
              </div>
              {errors.dataHash && (
                <p className="text-red-600 text-sm">{errors.dataHash}</p>
              )}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-1">
                  <strong>💡 What is a Data Hash?</strong>
                </p>
                <p className="text-xs text-blue-600 mb-2">
                  SHA-256 encrypted version of original data. Server verifies and signs the hash for security.
                  Only this hash is recorded on blockchain, not the original data.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-green-600">
                    ✅ <strong>Server Verification:</strong> Data hash is generated and verified server-side using SIGNER_KEY.
                    This ensures data integrity and authenticity.
                  </p>
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700">
                      🔐 <strong>Security Flow:</strong> 
                      1. Enter Validator/Server IDs → 2. Enter original data → 3. Generate server-signed hash → 4. Submit validation request
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">Reward Amount (AVAX)</label>
            <div className="space-y-2">
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.001"
                value={formData.rewardAmount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, rewardAmount: e.target.value }));
                  setRequestResult(null);
                  setErrors({});
                }}
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.rewardAmount && (
                <p className="text-red-600 text-sm">{errors.rewardAmount}</p>
              )}
              <p className="text-xs text-gray-500">
                Minimum reward: 0.001 AVAX. Higher rewards may attract better validators.
              </p>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleValidationRequest}
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Validation Request ({formData.rewardAmount} AVAX)
              </>
            )}
          </Button>

          {/* Request Result */}
          {requestResult && (
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              requestResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start space-x-3">
                {requestResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    requestResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Validation Request {requestResult.success ? 'Submitted' : 'Failed'}
                  </p>
                  <p className={`text-sm ${
                    requestResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {requestResult.message}
                  </p>
                  {requestResult.txHash && requestResult.success && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-green-600">Transaction Hash:</p>
                      <code className="text-xs bg-white p-2 rounded border break-all block">
                        {requestResult.txHash}
                      </code>
                      {requestResult.snowtraceUrl && (
                        <button
                          onClick={() => window.open(requestResult.snowtraceUrl, '_blank')}
                          className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded hover:from-blue-600 hover:to-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          🔍 View on Snowtrace
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setRequestResult(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Process Info */}
      <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border-green-200 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-green-800">Validation Process</p>
                <Mountain className="h-4 w-4 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-green-700">
                  ✓ Input original data → Auto-generate SHA-256 hash
                </p>
                <p className="text-sm text-green-700">
                  ✓ Select expert validator and request data verification
                </p>
                <p className="text-sm text-green-700">
                  ✓ Set reward (minimum 0.001 AVAX)
                </p>
                <p className="text-sm text-green-700">
                  ✓ Validator responds with quality assessment score (0-100)
                </p>
                <p className="text-sm text-green-700">
                  ✓ Build trust as verified data on blockchain
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Privacy Info */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-blue-200 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-blue-800">🔒 Privacy Protection System</p>
                <Mountain className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-blue-700">
                  🔐 <strong>Data Confidentiality:</strong> Actual data remains private, only hash recorded on chain
                </p>
                <p className="text-sm text-blue-700">
                  🏢 <strong>Off-chain Verification:</strong> Validators receive and verify original data separately
                </p>
                <p className="text-sm text-blue-700">
                  ✅ <strong>Integrity Guarantee:</strong> Matching hash enables data tampering detection
                </p>
                <p className="text-sm text-blue-700">
                  🌐 <strong>Distributed Verification:</strong> Independent quality assessment by multiple validators
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
