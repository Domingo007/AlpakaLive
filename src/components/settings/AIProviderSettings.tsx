import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { useSettings } from '@/hooks/useDatabase';
import { PROVIDER_INFO, testConnection, type AIProvider } from '@/lib/ai-provider';

const PROVIDERS: AIProvider[] = ['anthropic', 'openai', 'gemini'];

export function AIProviderSettings() {
  const { settings, update } = useSettings();
  const [apiKeyInput, setApiKeyInput] = useState(settings?.apiKey || '');
  const [provider, setProvider] = useState<AIProvider>((settings?.aiProvider as AIProvider) || 'anthropic');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSave() {
    setTesting(true);
    setTestResult(null);

    if (apiKeyInput.trim()) {
      const result = await testConnection({ provider, apiKey: apiKeyInput.trim() });
      setTestResult(result);

      if (result.success) {
        await update({ apiKey: apiKeyInput.trim(), aiProvider: provider });
      }
    } else {
      await update({ apiKey: '', aiProvider: provider });
      setTestResult({ success: true, message: 'Zapisano (tryb demo — brak klucza API)' });
    }

    setTesting(false);
  }

  return (
    <Card title="🤖 Model AI">
      <div className="space-y-3">
        {/* Provider selection */}
        <div className="space-y-2">
          {PROVIDERS.map(p => {
            const info = PROVIDER_INFO[p];
            const selected = provider === p;
            return (
              <button
                key={p}
                onClick={() => { setProvider(p); setTestResult(null); }}
                className={`w-full text-left rounded-lg p-3 border transition-colors ${
                  selected ? 'border-accent-dark bg-accent-warm/20' : 'border-border bg-bg-primary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{info.label}</span>
                  <span className="text-[10px] text-text-secondary">{info.cost}</span>
                </div>
                <div className="text-[10px] text-text-secondary mt-0.5">{info.description}</div>
                {p === 'gemini' && (
                  <div className="text-[9px] text-alert-warning mt-1">
                    ⚠️ Darmowy tier — dane mogą być używane do trenowania modelu
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* API Key */}
        <div>
          <label className="text-xs text-text-secondary block mb-1">Klucz API</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => { setApiKeyInput(e.target.value); setTestResult(null); }}
              placeholder={provider === 'anthropic' ? 'sk-ant-...' : provider === 'openai' ? 'sk-...' : 'AI...'}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary pr-16"
            />
            <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
              {showKey ? 'Ukryj' : 'Pokaż'}
            </button>
          </div>
        </div>

        {/* Link */}
        <p className="text-[10px] text-text-secondary">
          🔗 Gdzie uzyskać klucz: <span className="font-medium">{PROVIDER_INFO[provider].link}</span>
        </p>

        {/* Save & Test */}
        <button
          onClick={handleSave}
          disabled={testing}
          className="w-full bg-accent-dark text-accent-warm rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {testing ? 'Testuję połączenie...' : 'Zapisz i testuj'}
        </button>

        {/* Test result */}
        {testResult && (
          <div className={`rounded-lg px-3 py-2 text-xs ${
            testResult.success ? 'bg-alert-positive/10 text-alert-positive' : 'bg-alert-critical/10 text-alert-critical'
          }`}>
            {testResult.success ? '✅' : '❌'} {testResult.message}
          </div>
        )}

        <p className="text-[10px] text-text-secondary">
          Klucz przechowywany lokalnie. Dane osobowe filtrowane przez PII Sanitizer przed wysłaniem.
        </p>
      </div>
    </Card>
  );
}
