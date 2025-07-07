import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the deployed addresses file for Anvil (chain ID 31337)
    const contractsPath = path.join(
      process.cwd(),
      '../../packages/contracts/deployed-addresses-31337.json'
    );
    
    // Check if file exists
    if (!fs.existsSync(contractsPath)) {
      return NextResponse.json(
        { error: 'Anvil contracts not deployed' },
        { status: 404 }
      );
    }
    
    // Read and parse the file
    const fileContent = fs.readFileSync(contractsPath, 'utf-8');
    const addresses = JSON.parse(fileContent);
    
    // Return the addresses
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error loading Anvil contracts:', error);
    return NextResponse.json(
      { error: 'Failed to load Anvil contracts' },
      { status: 500 }
    );
  }
}