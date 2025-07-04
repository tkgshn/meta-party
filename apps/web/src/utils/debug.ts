// Debug utility functions to help identify environment and configuration issues

export function logEnvironmentVariables() {
  console.log('🔍 Environment Variables Debug:');
  console.log('NEXT_PUBLIC_PLAY_TOKEN_ADDRESS:', process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS);
  console.log('NEXT_PUBLIC_MARKET_FACTORY_ADDRESS:', process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS);
  console.log('NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS:', process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS);
  console.log('NEXT_PUBLIC_POLYGON_AMOY_RPC_URL:', process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Build-time env check complete');
}

export function validateContractAddresses() {
  const playTokenAddress = process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS;
  const marketFactoryAddress = process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS;
  const conditionalTokensAddress = process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS;

  const validation = {
    playToken: {
      address: playTokenAddress,
      isValid: playTokenAddress?.startsWith('0x') && playTokenAddress.length === 42,
      error: !playTokenAddress ? 'Not set' : 
             !playTokenAddress.startsWith('0x') ? 'Invalid format (no 0x prefix)' :
             playTokenAddress.length !== 42 ? 'Invalid length' : null,
    },
    marketFactory: {
      address: marketFactoryAddress,
      isValid: marketFactoryAddress?.startsWith('0x') && marketFactoryAddress.length === 42,
      error: !marketFactoryAddress ? 'Not set' : 
             !marketFactoryAddress.startsWith('0x') ? 'Invalid format (no 0x prefix)' :
             marketFactoryAddress.length !== 42 ? 'Invalid length' : null,
    },
    conditionalTokens: {
      address: conditionalTokensAddress,
      isValid: conditionalTokensAddress?.startsWith('0x') && conditionalTokensAddress.length === 42,
      error: !conditionalTokensAddress ? 'Not set' : 
             !conditionalTokensAddress.startsWith('0x') ? 'Invalid format (no 0x prefix)' :
             conditionalTokensAddress.length !== 42 ? 'Invalid length' : null,
    },
  };

  console.log('🔍 Contract Address Validation:', validation);
  return validation;
}

export function checkMetaMaskConnection() {
  const hasEthereum = typeof window !== 'undefined' && Boolean(window.ethereum);
  const isMetaMask = hasEthereum && Boolean(window.ethereum?.isMetaMask);
  
  console.log('🔍 MetaMask Connection Check:', {
    hasEthereum,
    isMetaMask,
    ethereumProvider: hasEthereum ? 'Available' : 'Not available',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available',
  });
  
  return { hasEthereum, isMetaMask };
}

// Call this on component mount to debug issues
export function debugPlayTokenSetup() {
  console.log('🚀 Play Token Debug Setup Started');
  logEnvironmentVariables();
  const validation = validateContractAddresses();
  const metamask = checkMetaMaskConnection();
  
  return {
    environment: {
      playTokenAddress: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS,
      nodeEnv: process.env.NODE_ENV,
    },
    validation,
    metamask,
    summary: {
      environmentOk: validation.playToken.isValid,
      metamaskOk: metamask.isMetaMask,
      readyToUse: validation.playToken.isValid && metamask.isMetaMask,
    }
  };
}