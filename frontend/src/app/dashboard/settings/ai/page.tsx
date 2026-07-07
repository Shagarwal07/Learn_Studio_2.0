"use client";

import React, { useState, useEffect } from "react";

interface AiPlan {
  planType: string;
  status: string;
  monthlyLimit: number;
  monthlyUsed: number;
}

interface AiKey {
  id: number;
  provider: string;
  keyLast4: string;
  createdAt: string;
}

export default function AiSettingsPage() {
  const [plan, setPlan] = useState<AiPlan | null>(null);
  const [keys, setKeys] = useState<AiKey[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newKey, setNewKey] = useState("");
  const [newProvider, setNewProvider] = useState("OPENROUTER");
  const [adding, setAdding] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const [planRes, keysRes] = await Promise.all([
        fetch("http://localhost:8080/api/settings/ai/plan", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:8080/api/settings/ai/keys", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (planRes.ok) {
        const pData = await planRes.json();
        setPlan(pData.data);
      }
      if (keysRes.ok) {
        const kData = await keysRes.json();
        setKeys(kData.data);
      }
    } catch (err) {
      setErrorMsg("Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (newKey.length < 10) return setErrorMsg("Invalid API Key");
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/settings/ai/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider: newProvider, apiKey: newKey })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("API Key successfully encrypted and stored.");
        setNewKey("");
        fetchData();
      } else {
        setErrorMsg(data.message || "Failed to save key");
      }
    } catch (err) {
      setErrorMsg("Network error");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteKey = async (id: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/settings/ai/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg("Key deleted permanently.");
        fetchData();
      }
    } catch (err) {
      setErrorMsg("Failed to delete key");
    }
  };

  if (loading) return <div className="p-8">Loading AI Settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">AI Studio Settings</h1>
      
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMsg}
        </div>
      )}

      {/* Plan Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Current Plan</h2>
        {plan ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plan Type</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">{plan.planType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">{plan.status}</p>
            </div>
            <div className="col-span-2 mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">Monthly Usage</span>
                <span className="text-gray-900 dark:text-white font-medium">{plan.monthlyUsed} / {plan.monthlyLimit} queries</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (plan.monthlyUsed / plan.monthlyLimit) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Could not load plan details.</p>
        )}
      </div>

      {/* BYOK Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bring Your Own Key (BYOK)</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect your own AI providers for unlimited generations at cost.</p>
          </div>
        </div>

        {/* Add Key Form */}
        <div className="flex gap-4 mb-8">
          <select 
            value={newProvider} 
            onChange={(e) => setNewProvider(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="OPENROUTER">OpenRouter (Any Model)</option>
            <option value="GEMINI">Google Gemini</option>
            <option value="OPENAI">OpenAI</option>
            <option value="ANTHROPIC">Anthropic</option>
          </select>
          <input 
            type="password" 
            placeholder="Paste your API key here..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button 
            onClick={handleAddKey}
            disabled={adding}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {adding ? "Saving..." : "Add Key"}
          </button>
        </div>

        {/* Active Keys List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Active Credentials</h3>
          {keys.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No custom API keys connected.</p>
          ) : (
            keys.map(k => (
              <div key={k.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    {k.provider.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{k.provider}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">**** {k.keyLast4}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteKey(k.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-lg">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Security Notice:</strong> All API keys are encrypted at rest using AES-256-GCM. LearnStudio engineers cannot view your raw API keys. Keys are only decrypted in-memory exactly at the moment of AI generation.
          </p>
        </div>
      </div>
    </div>
  );
}
