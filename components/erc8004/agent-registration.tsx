"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, CheckCircle, Loader2, Mountain, Snowflake, Shield } from "lucide-react";
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
  const [registeredAgent, setRegisteredAgent] = useState<{
    id: number;
    name: string;
    domain: string;
    txHash: string;
    snowtraceUrl?: string;
  } | null>(null);
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
      const transaction = prepareContractCall({
        contract: identityContract,
        method: "function newAgent(string memory domain, string memory cardURI) external payable returns (uint256)",
        params: [formData.agentName, formData.cardURI],
        value: AGENT_REGISTRATION_FEE, // 0.005 AVAX fee
      });

      sendTransaction(transaction, {
        onSuccess: (result) => {
          const snowtraceUrl = `https://c.testnet.snowtrace.io/tx/${result.transactionHash}`;
          const agentId = Date.now();
          
          const newAgent = {
            id: agentId,
            name: formData.agentName,
            domain: formData.agentName,
            txHash: result.transactionHash,
            snowtraceUrl,
          };

          setRegisteredAgent(newAgent);
          onAgentRegistered?.(newAgent);
          window.open(snowtraceUrl, '_blank');
          setFormData({ agentName: "", cardURI: "" });
        },
        onError: (error) => {
          setErrors({ 
            general: error.message || "Transaction failed. Please try again." 
          });
        },
      });

    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : "Registration failed. Please try again." 
      });
    }
  };

  const isFormValid = formData.agentName && formData.cardURI && Object.keys(errors).length === 0 && !!account;
  const isRegistering = isSending;

  const inputClasses = (hasError: boolean) =>
    `w-full rounded-2xl border px-4 py-3 text-white placeholder:text-stone-500 bg-[#080404] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d94548] ${
      hasError ? "border-[#ff9c9c]" : "border-white/15"
    }`;

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      <Card className="border-white/15 bg-[#120608]/85 text-white shadow-[0_25px_90px_rgba(0,0,0,0.45)]">
        <CardHeader className="border-b border-white/10 bg-gradient-to-r from-[#21090b] to-[#140405]">
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-[#b22c2f] to-[#6f1014] p-3">
                <Mountain className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-rose-100/80">Avalanche registry</span>
                <p className="text-2xl font-semibold text-white">Agent registration</p>
              </div>
            </div>
            <Badge className="w-fit items-center gap-2 border-white/20 bg-white/10 text-white">
              <Shield className="h-3.5 w-3.5" />
              ERC-8004 ready
            </Badge>
          </CardTitle>
          <CardDescription className="erc-panel-description">
            Mint an ERC-8004 NFT identity with tactile Avalanche styling. Inputs feel like ledger entries, not neon prompts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Fee Info */}
          <div className="rounded-3xl border border-white/10 bg-[#1b090b]/80 p-5 text-stone-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#b22c2f] to-[#6f1014] p-2">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-rose-200">Fee</p>
                <p className="text-lg font-semibold text-white">0.005 AVAX</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-stone-300">
              Registration mints a deterministic NFT that unlocks Client / Server / Validator roles.
            </p>
            <p className="mt-3 rounded-2xl bg-[#0b0405] px-4 py-3 text-xs text-rose-100/80">
              💎 Avalanche native costs are settled instantly; keep an extra 0.002 AVAX for gas.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-stone-400">
                Agent name
              </label>
              <input
                type="text"
                value={formData.agentName}
                onChange={(e) => handleInputChange("agentName", e.target.value)}
                placeholder="e.g., GlacierOps"
                className={inputClasses(!!errors.agentName)}
              />
              {errors.agentName && (
                <p className="mt-1 text-sm text-rose-200">{errors.agentName}</p>
              )}
              <p className="text-xs text-stone-500 mt-1">3-64 characters, alphanumeric only. Immutable once minted.</p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-stone-400">
                Metadata URI
              </label>
              <input
                type="url"
                value={formData.cardURI}
                onChange={(e) => handleInputChange("cardURI", e.target.value)}
                placeholder="ipfs://... or https://..."
                className={inputClasses(!!errors.cardURI)}
              />
              {errors.cardURI && (
                <p className="mt-1 text-sm text-rose-200">{errors.cardURI}</p>
              )}
              <p className="text-xs text-stone-500 mt-1">Link to JSON metadata describing the agent.</p>
            </div>
          </div>

          {errors.general && (
            <div className="rounded-2xl border border-rose-500/30 bg-[#2c0b0f] p-4 text-sm text-rose-100">
              {errors.general}
            </div>
          )}

          {!account ? (
            <div className="rounded-2xl border border-amber-500/30 bg-[#2b1906] p-4 text-sm text-amber-100">
              Connect your wallet to register an agent.
            </div>
          ) : null}

          <Button 
            onClick={handleRegister}
            disabled={!isFormValid || isRegistering}
            className="w-full rounded-2xl bg-gradient-to-r from-[#b22c2f] via-[#8e1b20] to-[#5f0c10] text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span className="font-semibold">Registering on Avalanche...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                <span className="font-semibold">Register Agent NFT</span>
              </>
            )}
          </Button>

          {/* Success Message */}
          {registeredAgent && (
            <div className="rounded-3xl border border-emerald-500/20 bg-[#0d1911] p-5 text-stone-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-2">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Success</p>
                  <p className="text-lg font-semibold text-white">Agent minted on Avalanche</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-stone-300">
                  <span>Agent Name</span>
                  <span className="font-medium text-white">{registeredAgent.name}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Agent ID</span>
                  <Badge variant="secondary" className="border-none bg-white/10 text-white">
                    {registeredAgent.id}
                  </Badge>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>Fee Paid</span>
                  <span className="font-medium text-white">0.005 AVAX</span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-stone-300 md:grid-cols-2">
                <a 
                  href={`https://testnet.snowtrace.io/address/${IDENTITY_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#080404] px-4 py-3 text-white hover:border-white/30"
                >
                  View contract
                  <Snowflake className="h-4 w-4" />
                </a>
                <button
                  onClick={() => registeredAgent.snowtraceUrl && window.open(registeredAgent.snowtraceUrl, '_blank')}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#080404] px-4 py-3 text-white hover:border-white/30"
                >
                  View transaction
                  <Shield className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-200">
                  ✓ Ready for Client / Server / Validator roles
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Process Steps */}
      <Card className="border-white/15 bg-[#0f0506]/85 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Registration process</CardTitle>
          <CardDescription className="erc-panel-description">
            Ledger steps for anchoring a new agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-stone-200">
            {["Name validation", "Availability check", "NFT issuance"].map((title, index) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  {index === 0 && (
                    <p className="text-sm text-stone-400">Confirm 3-64 characters, alphanumeric only.</p>
                  )}
                  {index === 1 && (
                    <p className="text-sm text-stone-400">Ensure the agent name is globally unique.</p>
                  )}
                  {index === 2 && (
                    <p className="text-sm text-stone-400">Pay 0.005 AVAX to mint identity inside IdentityRegistry.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
