import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { hardhat } from 'viem/chains';
import { FundAllocationABI } from '@/abi/FundAllocationABI';

export async function GET(request: Request) {
    try {
        console.log('API Request received:', request.url);
        
        // Extract query parameters
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');
        const functionName = searchParams.get('function');
        const argsString = searchParams.get('args');
        
        console.log('Query Parameters:', {
            address,
            functionName,
            argsString
        });
        
        // Validate required parameters
        if (!address) {
            console.error('Missing parameter: address');
            return NextResponse.json({ 
                error: 'Contract address is required' 
            }, { status: 400 });
        }
        
        if (!functionName) {
            console.error('Missing parameter: functionName');
            return NextResponse.json({ 
                error: 'Function name is required' 
            }, { status: 400 });
        }
        
        // Parse arguments if provided
        let args: any[] = [];
        if (argsString) {
            // Check if it's a single argument or an array
            if (argsString.startsWith('[') && argsString.endsWith(']')) {
                // It's an array in string form
                try {
                    args = JSON.parse(argsString);
                    console.log('Parsed arguments as JSON array:', args);
                } catch (error) {
                    // If parsing fails, treat as comma-separated values
                    args = argsString.slice(1, -1).split(',').map(arg => arg.trim());
                    console.log('Parsed arguments as comma-separated values:', args);
                }
            } else {
                // It's a single argument
                args = [argsString];
                console.log('Using single argument:', args);
            }
        }
        
        console.log(`📋 API Call: ${functionName}(${JSON.stringify(args)}) at ${address}`);
        
        // Check if the function exists in the ABI
        const functionExists = FundAllocationABI.some((item: any) => 
            item.type === 'function' && item.name === functionName
        );
        
        if (!functionExists) {
            console.error(`Function "${functionName}" not found in ABI`);
            return NextResponse.json({ 
                error: `Function "${functionName}" not found in contract ABI`,
                availableFunctions: FundAllocationABI
                    .filter((item: any) => item.type === 'function')
                    .map((item: any) => item.name)
            }, { status: 400 });
        }
        
        // Create a public client to interact with the blockchain
        console.log('Creating public client with Hardhat chain');
        const client = createPublicClient({
            chain: hardhat,
            transport: http('http://127.0.0.1:8545'),
        });
        
        // Additional logging of the request params
        console.log('Read contract params:', {
            address: address as `0x${string}`,
            abi: 'FundAllocationABI (omitted for brevity)',
            functionName,
            args,
        });
        
        // Log some ABI details for diagnostic purposes
        console.log('ABI Function Details:', FundAllocationABI
            .filter((item: any) => item.type === 'function' && item.name === functionName)
        );
        
        // Call the contract function
        console.log('Calling contract function...');
        const result = await client.readContract({
            address: address as `0x${string}`,
            abi: FundAllocationABI,
            functionName,
            args,
        });
        
        console.log(`✅ Result:`, result);
        
        // Return the result
        return NextResponse.json({ result });
    } catch (error: any) {
        console.error('❌ Error reading contract:', error);
        
        // Provide more detailed error information
        const errorInfo = {
            message: error.message || 'Failed to read contract data',
            details: error.details || {},
            code: error.code,
            name: error.name,
        };
        
        console.error('Error details:', errorInfo);
        
        return NextResponse.json({ 
            error: errorInfo.message,
            errorDetails: errorInfo
        }, { status: 500 });
    }
} 