import React, { useState } from 'react';
import { X, Store, CheckCircle, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';

export default function SettingsModal({
  onClose,
  status,
  onSettingsSaved,
  onSyncWooCommerce,
  onResetDemo
}) {
  const [activeTab, setActiveTab] = useState('ai');
  const [aiProvider, setAiProvider] = useState(status?.aiProvider || 'template');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  
  const [testingWc, setTestingWc] = useState(false);
  const [wcTestResult, setWcTestResult] = useState(null);
  const [syncingWc, setSyncingWc] = useState(false);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAI = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProvider,
          geminiApiKey: geminiKey,
          openaiApiKey: openaiKey,
          groqApiKey: groqKey
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        if (onSettingsSaved) onSettingsSaved();
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestWooCommerce = async () => {
    setTestingWc(true);
    setWcTestResult(null);

    try {
      const res = await fetch('/api/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl,
          consumerKey,
          consumerSecret
        })
      });

      const data = await res.json();
      setWcTestResult(data);
    } catch (err) {
      setWcTestResult({
        success: false,
        message: `Network error: ${err.message}`
      });
    } finally {
      setTestingWc(false);
    }
  };

  const handleSyncOrders = async () => {
    setSyncingWc(true);
    try {
      await onSyncWooCommerce({
        storeUrl,
        consumerKey,
        consumerSecret
      });
      onClose();
    } catch (err) {
      setWcTestResult({
        success: false,
        message: `Sync failed: ${err.message}`
      });
    } finally {
      setSyncingWc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Settings</h2>
              <p className="text-xs text-slate-400">
                Configure AI credentials or connect a read-only WooCommerce store
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-950/20 flex gap-4 text-xs">
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Model & Safeguards</span>
          </button>
          
          <button
            onClick={() => setActiveTab('woocommerce')}
            className={`pb-3 font-semibold transition border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'woocommerce'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>WooCommerce Store</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'ai' && (
            <form onSubmit={handleSaveAI} className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Cost Control Guardrail</span>
                </div>
                ShopPilot AI includes a deterministic fallback engine that requires no external API calls. When live LLM keys are supplied, one compact prompt is sent per user-triggered investigation.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Investigation Engine
                </label>
                <div className="space-y-2">
                  
                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="groq"
                      checked={aiProvider === 'groq'}
                      onChange={() => setAiProvider('groq')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Groq (GPT OSS 20B)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                          Fast JSON
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Low-latency OpenAI-compatible chat completions using GroqCloud.
                      </p>
                      {aiProvider === 'groq' && (
                        <div className="mt-2.5">
                          <input
                            type="password"
                            placeholder="Paste your GROQ_API_KEY..."
                            value={groqKey}
                            onChange={(e) => setGroqKey(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="template"
                      checked={aiProvider === 'template'}
                      onChange={() => setAiProvider('template')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Deterministic Template Engine</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          Offline
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Uses rule-guided template synthesis without calling external LLM APIs.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="gemini"
                      checked={aiProvider === 'gemini'}
                      onChange={() => setAiProvider('gemini')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Google Gemini (Gemini 1.5 Flash)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                          Structured JSON
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        High speed, low cost model with strict JSON schema enforcement.
                      </p>
                      {aiProvider === 'gemini' && (
                        <div className="mt-2.5">
                          <input
                            type="password"
                            placeholder="Paste your GEMINI_API_KEY..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="openai"
                      checked={aiProvider === 'openai'}
                      onChange={() => setAiProvider('openai')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>OpenAI (GPT-4o-mini)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Compact, structured JSON completions.
                      </p>
                      {aiProvider === 'openai' && (
                        <div className="mt-2.5">
                          <input
                            type="password"
                            placeholder="Paste your OPENAI_API_KEY..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </label>

                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {saveSuccess && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Settings saved.
                  </span>
                )}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="ml-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save AI Preferences'}
                </button>
              </div>

            </form>
          )}

          {activeTab === 'woocommerce' && (
            <div className="space-y-4">
              
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
                  <Store className="w-4 h-4 text-indigo-400" />
                  <span>Read-Only WooCommerce Connector</span>
                </div>
                Enter read-only REST API keys to sync store orders. Without credentials, the app continues using bundled sample data.
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Store HTTPS URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Consumer Key</label>
                  <input
                    type="text"
                    placeholder="ck_..."
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase">Consumer Secret</label>
                  <input
                    type="password"
                    placeholder="cs_..."
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {wcTestResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  wcTestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {wcTestResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    <span>{wcTestResult.success ? 'Connection Successful' : 'Connection Failed'}</span>
                  </div>
                  <p>{wcTestResult.message}</p>
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-2 justify-between items-center">
                <button
                  type="button"
                  onClick={handleTestWooCommerce}
                  disabled={testingWc || !storeUrl}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {testingWc ? 'Testing Store API...' : 'Test Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncOrders}
                  disabled={syncingWc || !storeUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
                >
                  {syncingWc ? 'Syncing...' : 'Fetch Orders'}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}


