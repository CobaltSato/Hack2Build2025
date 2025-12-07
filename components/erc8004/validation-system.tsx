"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Award, Mountain, Snowflake } from "lucide-react";

interface ValidationSystemProps {
  agents?: Array<{ id: number; name: string; domain: string }>;
}

interface ValidationRequest {
  id: string;
  validatorId: number;
  serverId: number;
  dataHash: string;
  reward: string;
  status: "pending" | "completed" | "expired";
  response?: number;
  timestamp: Date;
  expirationTime: Date;
}

export function ValidationSystem({ agents = [] }: ValidationSystemProps) {
  const [requests, setRequests] = useState<ValidationRequest[]>([
    {
      id: "val-1",
      validatorId: 3,
      serverId: 1,
      dataHash: "0x123...abc",
      reward: "0.005 AVAX",
      status: "completed",
      response: 95,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
    {
      id: "val-2", 
      validatorId: 5,
      serverId: 2,
      dataHash: "0x456...def",
      reward: "0.008 AVAX",
      status: "pending",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
    {
      id: "val-3",
      validatorId: 1,
      serverId: 4,
      dataHash: "0x789...ghi",
      reward: "0.003 AVAX",
      status: "expired",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      expirationTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  ]);

  const [newRequest, setNewRequest] = useState({
    validatorId: "",
    serverId: "",
    dataContent: "",
    reward: "0.001",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeRemaining = (expirationTime: Date) => {
    const now = new Date();
    const diff = expirationTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getAgentName = (id: number) => {
    const agent = agents.find(a => a.id === id);
    return agent ? agent.name : `Agent #${id}`;
  };

  const handleSubmitValidationRequest = async () => {
    if (!newRequest.validatorId || !newRequest.serverId || !newRequest.dataContent || !newRequest.reward) {
      alert("Please fill in all fields");
      return;
    }

    if (parseFloat(newRequest.reward) < 0.001) {
      alert("Minimum reward is 0.001 AVAX");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock data hash generation
      const mockDataHash = "0x" + Array.from({ length: 6 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join("") + "...";

      const request: ValidationRequest = {
        id: `val-${Date.now()}`,
        validatorId: parseInt(newRequest.validatorId),
        serverId: parseInt(newRequest.serverId),
        dataHash: mockDataHash + Array.from({ length: 6 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(""),
        reward: `${newRequest.reward} AVAX`,
        status: "pending",
        timestamp: new Date(),
        expirationTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      };

      setRequests(prev => [request, ...prev]);
      
      // Reset form
      setNewRequest({
        validatorId: "",
        serverId: "",
        dataContent: "",
        reward: "0.001",
      });

      alert("Validation request sent successfully!");
    } catch (error) {
      alert("Failed to send validation request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidatorResponse = async (requestId: string, response: number) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: "completed" as const, response }
          : req
      )
    );
    alert(`Validation result ${response}/100 submitted`);
  };

  return (
    <div className="space-y-6">
      {/* Validation Request Form */}
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/10 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-red-800">Validation Request</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Avalanche Validation System</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            Request work quality validation by experts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-red-800">Pre-approval Required</span>
            </div>
            <p className="text-sm text-red-700">
              Validation target data requires pre-approval by administrators
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Snowflake className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-600">Secure validation process</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Validator</label>
              <select
                value={newRequest.validatorId}
                onChange={(e) => setNewRequest(prev => ({ ...prev, validatorId: e.target.value }))}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Please select</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>
                    #{agent.id} - {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Server ID (Requester)</label>
              <select
                value={newRequest.serverId}
                onChange={(e) => setNewRequest(prev => ({ ...prev, serverId: e.target.value }))}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Please select</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id.toString()}>
                    #{agent.id} - {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Data for Validation</label>
            <textarea
              value={newRequest.dataContent}
              onChange={(e) => setNewRequest(prev => ({ ...prev, dataContent: e.target.value }))}
              placeholder="Please enter the content you want validated..."
              rows={4}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This data hash must be pre-approved by administrators
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reward (AVAX)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={newRequest.reward}
              onChange={(e) => setNewRequest(prev => ({ ...prev, reward: e.target.value }))}
              className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum reward: 0.001 AVAX
            </p>
          </div>

          <Button 
            onClick={handleSubmitValidationRequest}
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Shield className="h-4 w-4 mr-2 animate-spin" />
                <span>Submitting request...</span>
              </>
            ) : (
              <>
                <Mountain className="h-4 w-4 mr-2" />
                <span>Request validation</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Requests List */}
      <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/10 border-orange-200">
        <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5 border-b border-orange-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-orange-800">Validation Tasks</span>
              <div className="flex items-center gap-2 mt-1">
                <Snowflake className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">Live Validation Tasks</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-orange-700">
            Current validation request status ({requests.length} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {getAgentName(request.validatorId)} → {getAgentName(request.serverId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reward: {request.reward} | Data hash: {request.dataHash.slice(0, 10)}...
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge 
                      variant={
                        request.status === "completed" ? "default" :
                        request.status === "pending" ? "secondary" : 
                        "destructive"
                      }
                    >
                      {request.status === "completed" ? "Completed" :
                       request.status === "pending" ? "In Progress" : "Expired"}
                    </Badge>
                  </div>
                </div>

                {request.status === "pending" && (
                  <div className="flex items-center space-x-2 text-sm text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>Time remaining: {formatTimeRemaining(request.expirationTime)}</span>
                  </div>
                )}

                {request.status === "completed" && request.response !== undefined && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Validation result: <strong>{request.response}/100</strong></span>
                  </div>
                )}

                {request.status === "expired" && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Validator response expired (subject to slashing)</span>
                  </div>
                )}

                {/* Mock validator response interface */}
                {request.status === "pending" && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Validator Control Area (Demo)
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 95)}
                      >
                        High rating (95 pts)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 60)}
                      >
                        Average (60 pts)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidatorResponse(request.id, 30)}
                      >
                        Low rating (30 pts)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {requests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No validation requests
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Process Timeline */}
      <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-b border-red-200">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-red-800">Validation Process</span>
              <div className="flex items-center gap-2 mt-1">
                <Mountain className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Avalanche Validation Flow</span>
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-red-700">
            Validation system workflow (completes within 4-5 hours)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white text-sm flex items-center justify-center mt-0.5 font-bold shadow-lg">
                1
              </div>
              <div>
                <p className="font-medium">Pre-approval check</p>
                <p className="text-sm text-gray-600">System confirms if data hash is pre-approved</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-sm flex items-center justify-center mt-0.5 font-bold shadow-lg">
                2
              </div>
              <div>
                <p className="font-medium">Validator verification</p>
                <p className="text-sm text-gray-600">Confirm if specified validator is active</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-sm flex items-center justify-center mt-0.5 font-bold shadow-lg">
                3
              </div>
              <div>
                <p className="font-medium">Deadline setting</p>
                <p className="text-sm text-gray-600">Set response deadline for 1000 blocks (approx. 4-5 hours)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-sm flex items-center justify-center mt-0.5 font-bold shadow-lg">
                4
              </div>
              <div>
                <p className="font-medium">Validation execution</p>
                <p className="text-sm text-gray-600">Validator evaluates quality on a 0-100 point scale</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white text-sm flex items-center justify-center mt-0.5 font-bold shadow-lg">
                5
              </div>
              <div>
                <p className="font-medium">Reward payment</p>
                <p className="text-sm text-gray-600">Send reward to validator upon validation completion</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}