'use client';

import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface WalletErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface WalletErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * WalletErrorBoundary - Comprehensive error boundary for wallet-related errors
 * 
 * Based on patterns from Uniswap, OpenSea, and other major DApps
 * Handles wallet connection errors, transaction failures, and network issues
 */
export default class WalletErrorBoundary extends Component<
  WalletErrorBoundaryProps,
  WalletErrorBoundaryState
> {
  private maxRetries = 3;

  constructor(props: WalletErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<WalletErrorBoundaryState> {
    // Update state to show the error UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WalletErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to monitoring service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In production, you would send this to your error monitoring service
    console.group('🚨 Wallet Error Report');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Boundary:', 'WalletErrorBoundary');
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
  };

  private getErrorType = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'USER_REJECTED';
    }
    if (message.includes('metamask') || message.includes('wallet')) {
      return 'WALLET_ERROR';
    }
    if (message.includes('network') || message.includes('connection')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('transaction') || message.includes('gas')) {
      return 'TRANSACTION_ERROR';
    }
    if (message.includes('hydration') || message.includes('ssr')) {
      return 'HYDRATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  };

  private getErrorMessage = (errorType: string): string => {
    switch (errorType) {
      case 'USER_REJECTED':
        return 'トランザクションがキャンセルされました。再度お試しください。';
      case 'WALLET_ERROR':
        return 'ウォレットの接続に問題があります。MetaMaskを確認してください。';
      case 'NETWORK_ERROR':
        return 'ネットワーク接続に問題があります。接続を確認してください。';
      case 'TRANSACTION_ERROR':
        return 'トランザクションの処理に失敗しました。ガス代を確認してください。';
      case 'HYDRATION_ERROR':
        return 'ページの読み込みに問題がありました。リロードしてください。';
      default:
        return '予期しないエラーが発生しました。';
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderErrorDetails = () => {
    const { error } = this.state;
    if (!error) return null;

    return (
      <details className="mt-4">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
          詳細情報を表示
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono text-gray-700">
          <div><strong>エラー:</strong> {error.message}</div>
          {error.stack && (
            <div className="mt-2">
              <strong>スタックトレース:</strong>
              <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Return custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorType = this.getErrorType(error);
      const errorMessage = this.getErrorMessage(errorType);
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
              エラーが発生しました
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 text-center mb-6">
              {errorMessage}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  再試行 ({this.maxRetries - retryCount} 回残り)
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                ページをリロード
              </button>
            </div>

            {/* Error Details */}
            {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}

            {/* Help Text */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                問題が解決しない場合は、MetaMaskを再起動するか、
                <br />
                ブラウザのキャッシュをクリアしてください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}