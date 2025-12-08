"use client";

import { useMemo, useState } from "react";
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
import { ValidationRequest } from "@/components/erc8004/validation-request";
import { ValidatorStaking } from "@/components/erc8004/validator-staking";
import { ValidatorRegistration } from "@/components/erc8004/validator-registration";
import { DetailedEvaluation } from "@/components/erc8004/detailed-evaluation";
import {
  type LucideIcon,
  User,
  Star,
  Shield,
  Bot,
  CreditCard,
  CheckCircle,
  Snowflake,
  Mountain,
  Award,
  Activity,
  ExternalLink,
} from "lucide-react";

const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Contract addresses (Fuji Testnet)
const CONTRACTS = {
  IdentityRegistry: "0x96eF5c6941d5f8dfB4a39F44E9238b85F01F4d29",
  ReputationRegistry: "0x7Bf906F3ae121c4a3a6b0F17abB2f445B4171015",
  ValidationRegistry: "0x488b53ef50aeB8ae97dE7Bb31C06Fa5e8024ed94",
} as const;

type ContractMeta = {
  title: string;
  address: string;
  icon: LucideIcon;
  accent: string;
  href: string;
};

const CONTRACT_METADATA: ContractMeta[] = [
  {
    title: "Identity Registry",
    address: CONTRACTS.IdentityRegistry,
    icon: User,
    accent: "text-rose-200",
    href: `https://c.testnet.snowtrace.io/address/${CONTRACTS.IdentityRegistry}`,
  },
  {
    title: "Reputation Registry",
    address: CONTRACTS.ReputationRegistry,
    icon: Star,
    accent: "text-amber-200",
    href: `https://c.testnet.snowtrace.io/address/${CONTRACTS.ReputationRegistry}`,
  },
  {
    title: "Validation Registry",
    address: CONTRACTS.ValidationRegistry,
    icon: Shield,
    accent: "text-emerald-200",
    href: `https://c.testnet.snowtrace.io/address/${CONTRACTS.ValidationRegistry}`,
  },
];

type SystemPillar = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
};

const SYSTEM_PILLARS: SystemPillar[] = [
  {
    icon: User,
    title: "Agent Identity",
    description:
      "Registry-backed identity anchors with attestable domains and deterministic NFTs across Avalanche subnets.",
    gradient: "from-[#a73438]/70 to-[#4d0a0c]/90",
  },
  {
    icon: Star,
    title: "Reputation Depth",
    description:
      "Granular scoring layered with whitelist controls, anomaly detection, and client/server pair analytics.",
    gradient: "from-[#b06128]/70 to-[#412310]/90",
  },
  {
    icon: Shield,
    title: "Validation Network",
    description:
      "Stake-weighted validator actions with dispute windows tuned for sub-minute Avalanche finality guarantees.",
    gradient: "from-[#2e5443]/70 to-[#0f1f18]/90",
  },
];

// Agent data for TokenIDs 61-65 (JSON management)
const AGENTS_61_TO_65 = [
  { id: 61, name: "Agent61", domain: "agent61", owner: "0x1234...5678", type: "AI" },
  { id: 62, name: "Agent62", domain: "agent62", owner: "0x2345...6789", type: "AI" },
  { id: 63, name: "Agent63", domain: "agent63", owner: "0x3456...7890", type: "AI" },
  { id: 64, name: "Agent64", domain: "agent64", owner: "0x4567...8901", type: "AI" },
  { id: 65, name: "Agent65", domain: "agent65", owner: "0x5678...9012", type: "AI" },
];

export default function ERC8004Page() {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const [activeTab, setActiveTab] = useState("overview");
  const [userRegisteredAgents, setUserRegisteredAgents] = useState<number[]>([]);
  const [registeredAgents, setRegisteredAgents] = useState(AGENTS_61_TO_65);
  const [selectedAgentForEvaluation, setSelectedAgentForEvaluation] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const userAgents = useMemo(() => {
    const mockAgents = account?.address ? [61, 63] : [];
    if (!mockAgents.length && !userRegisteredAgents.length) {
      return [];
    }
    const combined = new Set<number>([...mockAgents, ...userRegisteredAgents]);
    return Array.from(combined).sort((a, b) => a - b);
  }, [account?.address, userRegisteredAgents]);

  const handleAgentRegistered = (agent: { id: number; name: string; domain: string }) => {
    const newAgent = {
      id: agent.id,
      name: agent.name,
      domain: agent.domain,
      owner:
        account?.address?.substring(0, 6) + "..." + account?.address?.substring(38) || "0x...",
      type: "New",
    };
    setRegisteredAgents((prev) => [newAgent, ...prev]);
    setUserRegisteredAgents((prev) => [...prev, agent.id]);
  };

  const heroMetrics = [
    {
      label: "Registered Agents",
      value: registeredAgents.length.toString().padStart(2, "0"),
      detail: "live on Fuji",
    },
    {
      label: "Validator Weight",
      value: "27",
      detail: "active validators",
    },
    {
      label: "Finality Target",
      value: "< 90s",
      detail: "settlement SLA",
    },
    {
      label: "AVAX Flow",
      value: "6.4",
      detail: "AVAX locked",
    },
  ];

  if (!wallet) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#050303] text-stone-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,65,66,0.35),_transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(9,20,23,0.75),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#a3272d]/30 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto flex max-w-5xl px-6 py-20">
          <Card className="w-full border-white/15 bg-[#090405]/90 p-10 text-left shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
            <CardHeader className="px-0">
              <CardTitle className="space-y-4">
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100/70">
                  <Snowflake className="h-4 w-4 text-rose-100" />
                  <span>Avalanche Fuji</span>
                </div>
                <div>
                  <p className="text-sm text-rose-100/70">ERC-8004 Trust Framework</p>
                  <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                    Avalanche-native agent validation built for people, not prompts
                  </h1>
                </div>
              </CardTitle>
              <CardDescription className="text-base text-stone-300">
                Connect your wallet to step into a heavier, more tactile registry experience. Every surface mirrors the Avalanche aesthetic with layered glass, volcanic reds, and purposeful typography.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-3 text-sm text-stone-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                    <Shield className="h-4 w-4 text-rose-200" />
                    Zero-trust attestations
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                    <Award className="h-4 w-4 text-amber-200" />
                    Enterprise governance
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                    <CreditCard className="h-4 w-4 text-emerald-200" />
                    Native AVAX settlement
                  </span>
                </div>
                <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-[#b22c2f] to-[#7c1216] p-2 shadow-lg">
                  <ConnectButton client={client} />
                </div>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[Shield, Bot, Mountain].map((Icon, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-inner"
                  >
                    <Icon className="mb-3 h-5 w-5 text-rose-200" />
                    <p className="text-sm text-stone-200">
                      {idx === 0 && "Audited registry and dispute windows tuned for Avalanche finality."}
                      {idx === 1 && "Human-readable naming backed by deterministic NFTs for each agent persona."}
                      {idx === 2 && "Validator collectives anchored to Avalanche subnets for deterministic uptime."}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040203] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(232,65,66,0.25),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(5,6,12,0.9),_transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#db2d34]/30 via-transparent to-transparent" />

      {/* Header */}
      <div className="relative z-20 border-b border-white/10 bg-[#060303]/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100/80">
                <Snowflake className="h-4 w-4 text-rose-100" />
                <span>Avalanche Fuji Network</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-[#b22c2f] to-[#740e12] p-3 shadow-lg">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold text-white">Curated ​Agent Trust​ 8004</h1>
                  <p className="text-sm text-stone-300">Grounded registry + validation rails for Avalanche-native agents.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-rose-100/80">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live environment</span>
                    </div>
                    <Separator orientation="vertical" className="hidden h-4 bg-white/20 md:block" />
                    <div className="flex items-center gap-2">
                      <Activity className="h-3 w-3" />
                      <span>Settlement ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex flex-wrap gap-3 text-xs font-medium text-stone-200">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  <Award className="h-3.5 w-3.5 text-amber-200" />
                  Enterprise validation
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-200" />
                  AVAX settlements
                </span>
              </div>
              <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-[#b22c2f] to-[#7c1216] p-1.5 shadow-lg">
                <ConnectButton client={client} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-10 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 grid-rows-2 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 md:grid-cols-7 md:grid-rows-1">
            <TabsTrigger
              value="overview"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Agents
            </TabsTrigger>
            <TabsTrigger
              value="registration"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Register
            </TabsTrigger>
            <TabsTrigger
              value="feedback"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Evaluate
            </TabsTrigger>
            <TabsTrigger
              value="validation"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Validate
            </TabsTrigger>
            <TabsTrigger
              value="staking"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Stake
            </TabsTrigger>
            <TabsTrigger
              value="validator"
              className="rounded-xl border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70 transition-all data-[state=active]:border-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white"
            >
              Validators
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <Card className="border-white/15 bg-[#0f0506]/90 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
              <CardHeader className="border-b border-white/10 bg-gradient-to-r from-[#1f0b0d]/80 to-[#150506]/80">
                <CardTitle className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-[#b22c2f] to-[#740e12] p-4 shadow-lg">
                      <Shield className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-rose-100/80">Avalanche Control Plane</p>
                      <span className="text-3xl font-semibold text-white">Validation Layers</span>
                      <p className="text-sm text-stone-300">
                        Registry, reputation, and settlement rails tuned for Avalanche teams who value tactility over neon.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-stone-200">
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
                      Production surface
                    </Badge>
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                      <Mountain className="mr-2 h-3.5 w-3.5" />
                      Avalanche tuned
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-stone-300">
                  Use ERC-8004 to anchor agent identity, reputation, and validator coordination with Avalanche-native ergonomics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6 md:grid-cols-4">
                  {heroMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-stone-400">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                      <p className="text-sm text-stone-300">{metric.detail}</p>
                    </div>
                  ))}
                </div>

                <Separator className="my-8 bg-white/10" />

                <div className="grid gap-6 md:grid-cols-3">
                  {SYSTEM_PILLARS.map((pillar) => (
                    <div
                      key={pillar.title}
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${pillar.gradient} p-5 shadow-lg`}
                    >
                      <pillar.icon className="mb-3 h-6 w-6 text-white" />
                      <p className="text-lg font-semibold text-white">{pillar.title}</p>
                      <p className="text-sm text-stone-100/80">{pillar.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 rounded-3xl border border-white/10 bg-[#110607]/90 p-6 shadow-inner">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-rose-100/80">On-chain deployment status</p>
                      <h3 className="text-2xl font-semibold text-white">Avalanche Fuji live contracts</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-200">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Online & synced
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {CONTRACT_METADATA.map((contract) => (
                      <div
                        key={contract.title}
                        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full border border-white/20 bg-white/10 p-2 ${contract.accent}`}>
                            <contract.icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm text-stone-300">{contract.title}</p>
                            <p className="font-semibold text-white">Fuji subnet</p>
                          </div>
                        </div>
                        <code className="rounded-xl bg-[#050305]/70 p-3 text-xs text-rose-100/90">
                          {contract.address}
                        </code>
                        <a
                          href={contract.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-rose-200"
                        >
                          View on Snowtrace
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/15 bg-[#100607]/90 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-xl text-white">Enterprise circuitry</CardTitle>
                <CardDescription className="text-stone-300">
                  Layered experiences tailored for Avalanche builders who prefer warmth and weight.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <Bot className="h-6 w-6 text-rose-200" />
                    <p className="mt-4 text-lg font-semibold text-white">Unified agent model</p>
                    <p className="text-sm text-stone-300">
                      Role-flexible NFTs map cleanly to client, server, and validator responsibilities without swapping UI contexts.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <User className="h-6 w-6 text-rose-200" />
                    <p className="mt-4 text-lg font-semibold text-white">Natural language registry</p>
                    <p className="text-sm text-stone-300">
                      Inputs feel like filling a ledger, with inline validation and contextual helper copy instead of floating hints.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <CreditCard className="h-6 w-6 text-rose-200" />
                    <p className="mt-4 text-lg font-semibold text-white">Native AVAX flow</p>
                    <p className="text-sm text-stone-300">
                      Payment rails interleave every action with transparent fee cues that mirror Avalanche Core design language.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card className="border-white/15 bg-[#120607]/80">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex flex-col gap-2 text-white md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-rose-100/80">Registry directory</p>
                    <span className="text-2xl font-semibold">Avalanche agents ({registeredAgents.length})</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-stone-200">
                    <Mountain className="h-4 w-4" />
                    live token IDs 61-65
                  </div>
                </CardTitle>
                <CardDescription className="text-stone-400">
                  Scroll through agent NFTs. Owned agents are surfaced with a lava gradient pill for fast recognition.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[420px]">
                  <div className="space-y-4 p-6">
                    {registeredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 shadow-inner transition hover:border-white/40 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-[#b22c2f] to-[#6f1014] text-2xl font-semibold text-white shadow-lg">
                            {agent.id}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white">{agent.name}</p>
                            <div className="flex items-center gap-2 text-sm text-stone-300">
                              <Mountain className="h-4 w-4 text-rose-200" /> @{agent.domain}
                            </div>
                            <p className="text-xs text-stone-400">{agent.owner}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="border-none bg-white/10 text-white">
                              {agent.type}
                            </Badge>
                            {userAgents.includes(agent.id) && (
                              <Badge className="border-none bg-gradient-to-r from-[#b22c2f] to-[#6f1014] text-white">
                                Owned
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedAgentForEvaluation({
                                id: agent.id.toString(),
                                name: agent.name,
                              })
                            }
                            className="bg-white/10 text-white hover:bg-white/20"
                          >
                            Inspect agent
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
            <ValidationRequest />
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
