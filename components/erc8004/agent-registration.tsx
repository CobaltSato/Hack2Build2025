"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, CheckCircle, Loader2, Mountain, Snowflake } from "lucide-react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { createThirdwebClient, getContract, prepareContractCall } from "thirdweb";
import { avalancheFuji } from "thirdweb/chains";

interface AgentRegistrationProps {
  onAgentRegistered?: (agent: { id: number; name: string; domain: string }) => void;
}

// Contract configuration
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const IDENTITY_REGISTRY_ADDRESS = "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29";
const AGENT_REGISTRATION_FEE = BigInt("5000000000000000"); // 0.005 AVAX in wei

const identityContract = getContract({
  client,
  chain: avalancheFuji,
  address: IDENTITY_REGISTRY_ADDRESS,
});

export function AgentRegistration({ onAgentRegistered }: AgentRegistrationProps) {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending: isSending } = useSendTransaction();
  
  const [formData, setFormData] = useState({
    agentName: "",
    cardURI: "",
  });
  const [registeredAgent, setRegisteredAgent] = useState<{ id: number; name: string; domain: string; txHash: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAgentName = (name: string) => {
    if (name.length < 3 || name.length > 64) {
      return "Agent name must be between 3-64 characters";
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
      return "Only alphanumeric characters are allowed";
    }
    return "";
  };

  const validateCardURI = (uri: string) => {
    if (!uri) {
      return "Metadata URI is required";
    }
    if (!uri.startsWith("ipfs://") && !uri.startsWith("https://")) {
      return "Please enter a valid IPFS or HTTPS URL";
    }
    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const newErrors = { ...errors };
    if (field === "agentName") {
      const error = validateAgentName(value);
      if (error) {
        newErrors.agentName = error;
      } else {
        delete newErrors.agentName;
      }
    } else if (field === "cardURI") {
      const error = validateCardURI(value);
      if (error) {
        newErrors.cardURI = error;
      } else {
        delete newErrors.cardURI;
      }
    }
    setErrors(newErrors);
  };

  const handleRegister = async () => {
    if (!account) {
      setErrors({ general: "Please connect your wallet first" });
      return;
    }

    // Validate all fields
    const nameError = validateAgentName(formData.agentName);
    const uriError = validateCardURI(formData.cardURI);
    
    if (nameError || uriError) {
      setErrors({
        ...(nameError && { agentName: nameError }),
        ...(uriError && { cardURI: uriError }),
      });
      return;
    }

    setErrors({});

    try {
      console.log('Starting registration with:', {
        agentName: formData.agentName,
        cardURI: formData.cardURI,
        userAddress: account.address,
      });

      // Prepare the contract call
      const transaction = prepareContractCall({
        contract: identityContract,
        method: "function newAgent(string memory domain, string memory cardURI) external payable returns (uint256)",
        params: [formData.agentName, formData.cardURI],
        value: AGENT_REGISTRATION_FEE, // 0.005 AVAX fee
      });

      // Send the transaction using user's wallet
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('Transaction successful:', result);
          
          // Generate mock agent ID (in real app, you'd parse the transaction receipt for the returned token ID)
          const agentId = Date.now();
          
          const newAgent = {
            id: agentId,
            name: formData.agentName,
            domain: formData.agentName,
            txHash: result.transactionHash,
          };

          setRegisteredAgent(newAgent);
          onAgentRegistered?.(newAgent);

          // Reset form
          setFormData({ agentName: "", cardURI: "" });
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          setErrors({ 
            general: error.message || "Transaction failed. Please try again." 
          });
        },
      });

    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : "Registration failed. Please try again." 
      });
    }
  };

  const isFormValid = formData.agentName && formData.cardURI && Object.keys(errors).length === 0 && !!account;
  const isRegistering = isSending;

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Mountain className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl text-red-800">Agent Registration</span>
              <div className="flex items-center gap-2 mt-1">
                <Snowflake className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600 font-medium">Avalanche Network</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            Register a new AI agent NFT in the ERC-8004 IdentityRegistry contract
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Fee Info */}
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-5 rounded-xl border border-red-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                <Mountain className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-red-800">Registration Fee: 0.005 AVAX</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Snowflake className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600">Avalanche blockchain fee</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg">
              💎 Agent registration mints an NFT identity for Client/Server/Validator roles
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Agent Name (3-64 characters, alphanumeric only)
              </label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => handleInputChange("agentName", e.target.value)}
                placeholder="e.g., StudyHelper"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.agentName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.agentName && (
                <p className="text-sm text-red-600 mt-1">{errors.agentName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Once used, agent names cannot be reused
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Metadata URI
              </label>
              <input
                type="url"
                value={formData.cardURI}
                onChange={(e) => handleInputChange("cardURI", e.target.value)}
                placeholder="ipfs://... or https://..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  errors.cardURI ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cardURI && (
                <p className="text-sm text-red-600 mt-1">{errors.cardURI}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                URI to JSON metadata containing agent details
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {!account ? (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-700">Please connect your wallet to register an agent</p>
            </div>
          ) : null}

          <Button 
            onClick={handleRegister}
            disabled={!isFormValid || isRegistering}
            className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span className="font-semibold">Registering Agent on Avalanche...</span>
              </>
            ) : (
              <>
                <Mountain className="h-5 w-5 mr-2" />
                <span className="font-semibold">Register Agent NFT</span>
              </>
            )}
          </Button>

          {/* Success Message - Right below the button */}
          {registeredAgent && (
            <div className="mt-4 p-5 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-green-800">🎉 Registration Successful!</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Mountain className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">NFT minted on Avalanche</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent Name:</span>
                  <span className="font-medium">{registeredAgent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent ID:</span>
                  <Badge variant="secondary" className="text-xs">{registeredAgent.id}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee Paid:</span>
                  <span className="font-medium">0.005 AVAX</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Contract:</span>
                  <a 
                    href={`https://testnet.snowtrace.io/address/${IDENTITY_REGISTRY_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 border border-blue-200"
                  >
                    View Contract →
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">Transaction:</span>
                  <a 
                    href={`https://testnet.snowtrace.io/tx/${registeredAgent.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 border border-blue-200"
                  >
                    View on Snowtrace →
                  </a>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  ✓ Ready for Client/Server/Validator roles
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Process</CardTitle>
          <CardDescription>
            How agent registration works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Name Validation</p>
                <p className="text-sm text-gray-600">Check 3-64 characters, alphanumeric only constraints</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Availability Check</p>
                <p className="text-sm text-gray-600">Check if the agent name is available</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">NFT Issuance</p>
                <p className="text-sm text-gray-600">Register agent in IdentityRegistry with 0.005 AVAX fee</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}