"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  CreditCard, 
  Globe, 
  Shield, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ExternalLink 
} from "lucide-react";

interface BankAccount {
  id: string;
  accountName: string;
  accountType: string;
  institutionName: string;
  mask?: string;
  currentBalance?: number;
  currencyCode: string;
}

interface BankConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accounts: BankAccount[]) => void;
}

interface SupportedRegion {
  provider: string;
  currencies: string[];
  countries: string[];
}

interface ConnectionState {
  step: 'region' | 'connecting' | 'success' | 'error';
  selectedRegion: string;
  linkToken?: string;
  provider?: string;
  error?: string;
  connectedAccounts?: BankAccount[];
}

export function BankConnectionModal({ isOpen, onClose, onSuccess }: BankConnectionModalProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    step: 'region',
    selectedRegion: '',
  });
  const [supportedRegions, setSupportedRegions] = useState<Record<string, SupportedRegion>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch supported regions on mount
  useEffect(() => {
    if (isOpen) {
      fetchSupportedRegions();
    }
  }, [isOpen]);

  const fetchSupportedRegions = async () => {
    try {
      const response = await fetch('/api/banking/connect?action=regions');
      const data = await response.json();
      
      if (data.success) {
        setSupportedRegions(data.data.supportedRegions);
        // Auto-select detected region
        if (data.data.autoDetectedRegion) {
          setConnectionState(prev => ({
            ...prev,
            selectedRegion: data.data.autoDetectedRegion
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch supported regions:', error);
    }
  };

  const initiateConnection = async () => {
    if (!connectionState.selectedRegion) return;

    setIsLoading(true);
    setConnectionState(prev => ({ ...prev, step: 'connecting' }));

    try {
      const response = await fetch('/api/banking/connect?action=initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: connectionState.selectedRegion,
          redirectUri: `${window.location.origin}/banking/callback`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionState(prev => ({
          ...prev,
          linkToken: data.data.linkToken,
          provider: data.data.provider,
        }));

        // Launch the appropriate banking connection flow
        await launchBankingFlow(data.data);
      } else {
        throw new Error(data.message || 'Failed to initiate connection');
      }
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  interface ConnectionData {
    provider: string;
    linkToken: string;
    region: string;
  }

  const launchBankingFlow = async (connectionData: ConnectionData) => {
    const { provider, region } = connectionData;

    try {
      let publicToken: string;

      if (provider === 'plaid') {
        publicToken = await launchPlaidLink();
      } else if (provider === 'truelayer') {
        publicToken = await launchTrueLayerLink();
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      await completeConnection(publicToken, region);
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Connection cancelled',
      }));
    }
  };

  const launchPlaidLink = async (): Promise<string> => {
    // For demo purposes, simulate Plaid Link flow
    // In production, you'd use the actual Plaid Link SDK
    return new Promise((resolve, reject) => {
      // Simulate user bank selection and authentication
      const mockPlaidFlow = confirm(
        `🏦 Plaid Bank Connection\n\nThis would normally open Plaid Link where you can:\n• Search for your bank\n• Enter your online banking credentials\n• Select accounts to connect\n\nClick OK to simulate successful connection.`
      );

      if (mockPlaidFlow) {
        // Simulate successful token exchange
        setTimeout(() => {
          resolve('public-token-' + Math.random().toString(36).substring(7));
        }, 1000);
      } else {
        reject(new Error('User cancelled'));
      }
    });
  };

  const launchTrueLayerLink = async (): Promise<string> => {
    // Simulate TrueLayer connection for EU/Spain
    return new Promise((resolve, reject) => {
      const mockTrueLayerFlow = confirm(
        `🇪🇸 TrueLayer Bank Connection (PSD2 Compliant)\n\nThis would redirect you to:\n• Select your Spanish/EU bank\n• Authenticate via your bank's secure login\n• Authorize account access\n• Return with connection token\n\nClick OK to simulate successful connection.`
      );

      if (mockTrueLayerFlow) {
        setTimeout(() => {
          resolve('auth-code-' + Math.random().toString(36).substring(7));
        }, 1500);
      } else {
        reject(new Error('User cancelled'));
      }
    });
  };


  const completeConnection = async (publicToken: string, region: string) => {
    try {
      const response = await fetch('/api/banking/connect?action=complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          region,
          metadata: { timestamp: new Date().toISOString() },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConnectionState(prev => ({
          ...prev,
          step: 'success',
          connectedAccounts: data.data.accounts,
        }));
        onSuccess(data.data.accounts);
      } else {
        throw new Error(data.message || 'Failed to complete connection');
      }
    } catch (error) {
      setConnectionState(prev => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to save connection',
      }));
    }
  };

  const resetConnection = () => {
    setConnectionState({
      step: 'region',
      selectedRegion: '',
    });
  };

  const getRegionInfo = (regionCode: string) => {
    const regionInfo = {
      'US': {
        name: 'United States',
        flag: '🇺🇸',
        description: 'Connect to 12,000+ US banks and credit unions',
        provider: 'Plaid',
      },
      'ES': {
        name: 'Spain',
        flag: '🇪🇸',
        description: 'Connect to Spanish banks',
        provider: 'TrueLayer',
      },
      'EU': {
        name: 'Europe',
        flag: '🇪🇺',
        description: 'PSD2-compliant access to European banks',
        provider: 'TrueLayer',
      },
    };
    return regionInfo[regionCode as keyof typeof regionInfo];
  };

  const renderRegionSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-emerald-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect Your Bank Account</h3>
        <p className="text-gray-600 text-sm">
          Securely connect your bank to automatically import transactions
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Your Region</label>
          <Select
            value={connectionState.selectedRegion}
            onValueChange={(value) => setConnectionState(prev => ({ ...prev, selectedRegion: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose your region..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(supportedRegions).map(([code, region]) => {
                const info = getRegionInfo(code);
                return (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span>{info?.flag}</span>
                      <span>{info?.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {region.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {connectionState.selectedRegion && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {getRegionInfo(connectionState.selectedRegion)?.name}
                    </span>
                    <Badge variant="outline">
                      {supportedRegions[connectionState.selectedRegion]?.provider}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getRegionInfo(connectionState.selectedRegion)?.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {supportedRegions[connectionState.selectedRegion]?.currencies.map(currency => (
                      <Badge key={currency} variant="secondary" className="text-xs">
                        {currency}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your banking credentials are never stored. We use bank-level security and comply with 
          PSD2, GDPR, and regional banking regulations.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={initiateConnection}
          disabled={!connectionState.selectedRegion || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Bank
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderConnecting = () => (
    <div className="text-center space-y-4">
      <Loader2 className="mx-auto h-12 w-12 text-emerald-600 animate-spin" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Connecting to your bank...</h3>
        <p className="text-gray-600 text-sm">
          You&apos;ll be redirected to securely authenticate with your bank
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Successfully Connected!</h3>
        <p className="text-gray-600 text-sm mb-4">
          {connectionState.connectedAccounts?.length} account(s) connected
        </p>
      </div>

      {connectionState.connectedAccounts && (
        <div className="space-y-2">
          {connectionState.connectedAccounts.map((account, index) => (
            <Card key={index}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{account.accountName}</div>
                    <div className="text-sm text-gray-600">
                      {account.institutionName} •••• {account.mask}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {account.currentBalance 
                        ? new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: account.currencyCode
                          }).format(account.currentBalance)
                        : '-'
                      }
                    </div>
                    <div className="text-sm text-gray-600">{account.accountType}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={onClose} className="w-full">
        Done
      </Button>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-4">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
      <div>
        <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
        <p className="text-gray-600 text-sm mb-4">
          {connectionState.error}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={resetConnection} className="flex-1">
          Try Again
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connectionState.step === 'region' && 'Connect Bank Account'}
            {connectionState.step === 'connecting' && 'Bank Connection'}
            {connectionState.step === 'success' && 'Connection Successful'}
            {connectionState.step === 'error' && 'Connection Error'}
          </DialogTitle>
        </DialogHeader>

        {connectionState.step === 'region' && renderRegionSelection()}
        {connectionState.step === 'connecting' && renderConnecting()}
        {connectionState.step === 'success' && renderSuccess()}
        {connectionState.step === 'error' && renderError()}
      </DialogContent>
    </Dialog>
  );
}