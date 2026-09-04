'use client';

import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import { DEMO_LINKS } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n';

export const ApiPlayground: React.FC = () => {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<'curl' | 'python' | 'node' | 'go' | 'php'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<'/api/parse' | '/api/download' | '/api/batch-parse' | '/api/gallery/resolve'>('/api/parse');
  const [apiUrl, setApiUrl] = useState(DEMO_LINKS[0].url);
  const [copied, setCopied] = useState(false);
  const [responseJson, setResponseJson] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const configuredEndpoint = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const [publicBaseEndpoint, setPublicBaseEndpoint] = useState(configuredEndpoint);

  useEffect(() => {
    if (!configuredEndpoint) {
      setPublicBaseEndpoint(window.location.origin);
    }
  }, [configuredEndpoint]);

  const generateCodeSnippet = () => {
    const fullUrl = `${publicBaseEndpoint}${selectedEndpoint}`;
    const payload = selectedEndpoint === '/api/batch-parse'
      ? { urls: [apiUrl] }
      : selectedEndpoint === '/api/download'
      ? { original_url: apiUrl }
      : { url: apiUrl };

    const jsonStr = JSON.stringify(payload, null, 2);

    switch (selectedLang) {
      case 'curl':
        return `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;

      case 'python':
        return `import requests

url = "${fullUrl}"
headers = {"Content-Type": "application/json"}
payload = ${JSON.stringify(payload, null, 4)}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Status Code:", response.status_code)
print(data)`;

      case 'node':
        return `const axios = require('axios');

async function callOmniMediaApi() {
  const res = await axios.post("${fullUrl}", ${jsonStr});
  console.log("Response Data:", res.data);
}

callOmniMediaApi();`;

      case 'go':
        return `package main

import (
	"bytes"
	"fmt"
	"net/http"
	"io/ioutil"
)

func main() {
	url := "${fullUrl}"
	payload := []byte(\`${JSON.stringify(payload)}\`)
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;

      case 'php':
        return `<?php
$ch = curl_init("${fullUrl}");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${jsonStr}));
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`;
    }
  };

  const handleRunApi = async () => {
    setLoading(true);
    setResponseJson(null);
    setStatusCode(null);
    const start = performance.now();
    try {
      const payload = selectedEndpoint === '/api/batch-parse'
        ? { urls: [apiUrl] }
        : selectedEndpoint === '/api/download'
        ? { original_url: apiUrl }
        : { url: apiUrl };

      const res = await fetch(`${configuredEndpoint}${selectedEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const end = performance.now();
      setResponseTime(Math.round(end - start));
      setStatusCode(res.status);
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseJson(JSON.stringify({ error: err.message || 'API request failed' }, null, 2));
      setStatusCode(500);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 text-xs text-blue-600 dark:text-cyan-400 font-mono font-medium">
          <Terminal className="w-3.5 h-3.5" />
          <span>{t.playground.tag}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t.playground.title}</h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          {t.playground.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Window */}
        <div className="lg:col-span-6 space-y-4">
          <div className="tikhub-panel rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xl">
            {/* macOS Bar */}
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="mac-dot mac-dot-red"></span>
                <span className="mac-dot mac-dot-yellow"></span>
                <span className="mac-dot mac-dot-green"></span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">{t.playground.requestGen}</span>
              </div>

              {/* Copy Code */}
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-cyan-400 hover:underline transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.docs.copied : t.playground.copySnippet}</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Endpoint selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 font-mono">{t.playground.targetEndpoint}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['/api/parse', '/api/download', '/api/batch-parse', '/api/gallery/resolve'] as const).map((ep) => (
                    <button
                      key={ep}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono transition text-center truncate ${
                        selectedEndpoint === ep
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 font-mono">{t.playground.inputUrl}</label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono shadow-inner"
                  placeholder="https://www.tiktok.com/@user/video/..."
                />
              </div>

              {/* Language selection pills */}
              <div>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs mb-2">
                  {[
                    { id: 'curl', label: 'cURL' },
                    { id: 'python', label: 'Python' },
                    { id: 'node', label: 'Node.js' },
                    { id: 'go', label: 'Go' },
                    { id: 'php', label: 'PHP' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedLang(item.id as any)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition ${
                        selectedLang === item.id
                          ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white font-bold shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Code Block */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto max-h-56 shadow-inner">
                  <pre>{generateCodeSnippet()}</pre>
                </div>
              </div>

              {/* Run API Button */}
              <button
                onClick={handleRunApi}
                disabled={loading}
                className="w-full btn-gradient-pill text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.playground.executing}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{t.playground.executeBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Response */}
        <div className="lg:col-span-6 space-y-4">
          <div className="tikhub-panel rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xl h-full flex flex-col justify-between">
            {/* macOS Bar */}
            <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="mac-dot mac-dot-red"></span>
                <span className="mac-dot mac-dot-yellow"></span>
                <span className="mac-dot mac-dot-green"></span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">{t.playground.responseViewer}</span>
              </div>

              {/* Latency & Status */}
              <div className="flex items-center gap-2">
                {statusCode && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    statusCode === 200 ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                  }`}>
                    {statusCode}
                  </span>
                )}
                {responseTime !== null && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-500/20">
                    <Clock className="w-3 h-3" />
                    <span>{responseTime} ms</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              {responseJson ? (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[420px] shadow-inner">
                  <pre>{responseJson}</pre>
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 text-xs p-6 text-center">
                  <Send className="w-8 h-8 mb-2 text-slate-300 dark:text-slate-600" />
                  <p>{t.playground.emptyPrompt}</p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 flex justify-between font-mono mt-4">
                <span>Content-Type: application/json</span>
                <span>CORS: {t.docs.corsPolicy}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
