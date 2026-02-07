/**
 * Settings modal for API key configuration
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useFlightStore } from '@/stores/flightStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [appDataDir, setAppDataDir] = useState('');
  const [appLogDir, setAppLogDir] = useState('');
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const {
    unitSystem,
    setUnitSystem,
    themeMode,
    setThemeMode,
    loadFlights,
    loadOverview,
    clearSelection,
    donationAcknowledged,
    setDonationAcknowledged,
  } = useFlightStore();

  // Check if API key exists on mount
  useEffect(() => {
    if (isOpen) {
      checkApiKey();
      getAppDataDir();
      getAppLogDir();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const hadModalClass = document.body.classList.contains('modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (!hadModalClass) {
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen]);

  const checkApiKey = async () => {
    try {
      const exists = await invoke<boolean>('has_api_key');
      setHasKey(exists);
    } catch (err) {
      console.error('Failed to check API key:', err);
    }
  };

  const getAppDataDir = async () => {
    try {
      const dir = await invoke<string>('get_app_data_dir');
      setAppDataDir(dir);
    } catch (err) {
      console.error('Failed to get app data dir:', err);
    }
  };

  const getAppLogDir = async () => {
    try {
      const dir = await invoke<string>('get_app_log_dir');
      setAppLogDir(dir);
    } catch (err) {
      console.error('Failed to get app log dir:', err);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await invoke('set_api_key', { apiKey: apiKey.trim() });
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setHasKey(true);
      setApiKey(''); // Clear the input for security
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to save: ${err}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await invoke('delete_all_flights');
      clearSelection();
      await loadFlights();
      await loadOverview();
      setMessage({ type: 'success', text: 'All logs deleted.' });
      setConfirmDeleteAll(false);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to delete: ${err}` });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dji-secondary rounded-xl border border-gray-700 shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Units */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Units
            </label>
            <select
              className="input w-full"
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
            >
              <option value="metric">Metric (m, km/h)</option>
              <option value="imperial">Imperial (ft, mph)</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme
            </label>
            <select
              className="input w-full"
              value={themeMode}
              onChange={(e) => setThemeMode(e.target.value as 'system' | 'dark' | 'light')}
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          {/* API Key Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              DJI API Key
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Required for decrypting V13+ flight logs. Get your key from{' '}
              <a
                href="https://developer.dji.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dji-primary hover:underline"
              >
                developer.dji.com
              </a>
            </p>
            <p className="text-xs text-gray-500 mb-3">
              The standalone app ships with a developer-provided key, but please use your own
              API key to avoid rate limit issues. See the
              {' '}
              <a
                href="https://developer.dji.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dji-primary hover:underline"
              >
                DJI developer portal
              </a>
              {' '}for guidance.
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  hasKey ? 'bg-green-500' : 'bg-yellow-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                {hasKey ? 'API key configured' : 'No API key configured'}
              </span>
            </div>

            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? '••••••••••••••••' : 'Enter your DJI API key'}
              className="input w-full"
            />

            {/* Message */}
            {message && (
              <p
                className={`mt-2 text-sm ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="btn-primary w-full mt-3"
            >
              {isSaving ? 'Saving...' : hasKey ? 'Update API Key' : 'Save API Key'}
            </button>

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Donation status
            </p>
            <button
              type="button"
              onClick={() => setDonationAcknowledged(!donationAcknowledged)}
              className="mt-2 flex items-center justify-between gap-3 w-full text-[0.85rem] text-gray-300"
              aria-pressed={donationAcknowledged}
            >
              <span>I have already donated. Remove banner</span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-all ${
                  donationAcknowledged
                    ? 'bg-dji-primary/90 border-dji-primary'
                    : 'bg-dji-surface border-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    donationAcknowledged ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Info Section */}
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              <strong className="text-gray-400">Data Location:</strong>
              <br />
              <code className="text-xs text-gray-400 bg-dji-dark px-1 py-0.5 rounded">
                {appDataDir || 'Loading...'}
              </code>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong className="text-gray-400">Log Location:</strong>
              <br />
              <code className="text-xs text-gray-400 bg-dji-dark px-1 py-0.5 rounded">
                {appLogDir || 'Loading...'}
              </code>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Your API key is stored locally in <code className="text-gray-400">config.json</code> and never sent to any external servers except DJI's official API.
            </p>
            {confirmDeleteAll ? (
              <div className="mt-4 rounded-lg border border-red-600/60 bg-red-500/10 p-3">
                <p className="text-xs text-red-200">
                  This action cannot be undone and will remove all flight logs.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={handleDeleteAll}
                    className="text-xs text-red-300 hover:text-red-200"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteAll(true)}
                className="mt-4 w-full py-2 px-3 rounded-lg border border-red-600 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Delete all logs
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
      </div>
    </div>
  );
}
