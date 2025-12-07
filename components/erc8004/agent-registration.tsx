"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, CheckCircle, Loader2 } from "lucide-react";

interface AgentRegistrationProps {
  onAgentRegistered?: (agent: { id: number; name: string; domain: string }) => void;
}

export function AgentRegistration({ onAgentRegistered }: AgentRegistrationProps) {
  const [formData, setFormData] = useState({
    domain: "",
    cardURI: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredAgent, setRegisteredAgent] = useState<{ id: number; name: string; domain: string } | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateDomain = (domain: string) => {
    if (domain.length < 3 || domain.length > 64) {
      return "ドメイン名は3-64文字である必要があります";
    }
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return "英数字、ハイフン、ピリオドのみ使用可能です";
    }
    return "";
  };

  const validateCardURI = (uri: string) => {
    if (!uri) {
      return "メタデータURIは必須です";
    }
    if (!uri.startsWith("ipfs://") && !uri.startsWith("https://")) {
      return "有効なIPFSまたはHTTPS URLを入力してください";
    }
    return "";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const newErrors = { ...errors };
    if (field === "domain") {
      const error = validateDomain(value);
      if (error) {
        newErrors.domain = error;
      } else {
        delete newErrors.domain;
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
    // Validate all fields
    const domainError = validateDomain(formData.domain);
    const uriError = validateCardURI(formData.cardURI);
    
    if (domainError || uriError) {
      setErrors({
        ...(domainError && { domain: domainError }),
        ...(uriError && { cardURI: uriError }),
      });
      return;
    }

    setIsRegistering(true);
    setErrors({});

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful registration
      const newAgent = {
        id: Date.now(), // Mock ID
        name: formData.domain.charAt(0).toUpperCase() + formData.domain.slice(1).replace(/[-.]/, ' '),
        domain: formData.domain,
      };

      setRegisteredAgent(newAgent);
      onAgentRegistered?.(newAgent);

      // Reset form
      setFormData({ domain: "", cardURI: "" });
    } catch (error) {
      setErrors({ general: "登録に失敗しました。もう一度お試しください。" });
    } finally {
      setIsRegistering(false);
    }
  };

  const isFormValid = formData.domain && formData.cardURI && Object.keys(errors).length === 0;

  return (
    <div className="space-y-6">
      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>エージェント登録</span>
          </CardTitle>
          <CardDescription>
            新しいAIエージェントをERC-8004システムに登録します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Fee Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">登録料: 0.005 AVAX</span>
            </div>
            <p className="text-sm text-blue-700">
              エージェント登録にはスパム防止のため登録料が必要です
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                エージェント名 (3-64文字、英数字のみ)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => handleInputChange("domain", e.target.value)}
                placeholder="例: study-helper"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.domain ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.domain && (
                <p className="text-sm text-red-600 mt-1">{errors.domain}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                一度使用された名前は再利用できません
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                メタデータURI
              </label>
              <input
                type="url"
                value={formData.cardURI}
                onChange={(e) => handleInputChange("cardURI", e.target.value)}
                placeholder="ipfs://... または https://..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cardURI ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.cardURI && (
                <p className="text-sm text-red-600 mt-1">{errors.cardURI}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                エージェントの詳細情報を含むJSONファイルのURI
              </p>
            </div>
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <Button 
            onClick={handleRegister}
            disabled={!isFormValid || isRegistering}
            className="w-full"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                エージェント登録中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                エージェントを登録
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Registration Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle>登録プロセス</CardTitle>
          <CardDescription>
            エージェント登録の流れ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">名前の審査</p>
                <p className="text-sm text-gray-600">3-64文字、英数字のみの制限をチェック</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">重複チェック</p>
                <p className="text-sm text-gray-600">同じ名前がないか確認</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">NFT発行</p>
                <p className="text-sm text-gray-600">デジタル学生証として発行、どの役割でも使用可能</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {registeredAgent && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">エージェント登録完了！</p>
                <p className="text-sm text-green-700">
                  {registeredAgent.name} (#{registeredAgent.id}) が正常に登録されました
                </p>
                <Badge variant="secondary" className="mt-2">
                  @{registeredAgent.domain}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}