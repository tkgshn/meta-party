// Contract testing utilities to verify smart contract deployment and functionality

export async function testPlayTokenContract() {
  const address = process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS || '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1';
  
  if (!address) {
    console.error('❌ PLAY_TOKEN_ADDRESS not set');
    return { success: false, error: 'Address not set' };
  }
  
  console.log('🧪 Testing Play Token contract at:', address);

  if (!window.ethereum) {
    console.error('❌ MetaMask not available');
    return { success: false, error: 'MetaMask not available' };
  }

  try {
    // Test 1: Check if contract exists (get code)
    const code = await window.ethereum.request({
      method: 'eth_getCode',
      params: [address, 'latest'],
    });

    if (code === '0x' || code === '0x0') {
      console.error('❌ No contract found at address:', address);
      return { success: false, error: 'No contract deployed' };
    }

    console.log('✅ Contract code found at address:', address);

    // Test 2: Check contract name (if it supports name function)
    try {
      const nameResult = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: address,
            data: '0x06fdde03', // name() function selector
          },
          'latest'
        ],
      });
      
      console.log('Contract name call result:', nameResult);
    } catch (nameError) {
      console.log('Name function not available or failed:', nameError);
    }

    // Test 3: Check total supply
    try {
      const totalSupplyResult = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: address,
            data: '0x18160ddd', // totalSupply() function selector
          },
          'latest'
        ],
      });
      
      console.log('Total supply result:', totalSupplyResult);
      
      if (totalSupplyResult && totalSupplyResult !== '0x') {
        const totalSupply = BigInt(totalSupplyResult as string);
        console.log('✅ Total supply:', totalSupply.toString());
      }
    } catch (supplyError) {
      console.log('Total supply check failed:', supplyError);
    }

    return { success: true, address, hasCode: true };
    
  } catch (error) {
    console.error('❌ Contract test failed:', error);
    return { success: false, error: error.message };
  }
}

export async function testNetworkConnection() {
  if (!window.ethereum) {
    return { success: false, error: 'MetaMask not available' };
  }

  try {
    // Get current network
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    
    const networkId = parseInt(chainId as string, 16);
    
    // Get current block number
    const blockNumber = await window.ethereum.request({
      method: 'eth_blockNumber',
    });
    
    const currentBlock = parseInt(blockNumber as string, 16);
    
    console.log('✅ Network connection test:', {
      chainId: networkId,
      currentBlock,
      isAmoy: networkId === 80002,
    });
    
    return {
      success: true,
      chainId: networkId,
      currentBlock,
      isAmoy: networkId === 80002,
    };
    
  } catch (error) {
    console.error('❌ Network test failed:', error);
    return { success: false, error: error.message };
  }
}

export async function runAllTests() {
  console.log('🧪 Running contract tests...');
  
  const networkTest = await testNetworkConnection();
  const contractTest = await testPlayTokenContract();
  
  const results = {
    network: networkTest,
    contract: contractTest,
    overall: networkTest.success && contractTest.success,
  };
  
  console.log('🧪 Test results:', results);
  
  return results;
}