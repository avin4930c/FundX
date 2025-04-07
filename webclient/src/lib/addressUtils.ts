/**
 * Format an Ethereum address to a more readable format (0x1234...5678)
 */
export function formatEthereumAddress(address: string, prefixLength = 6, suffixLength = 4): string {
    if (!address || address.length < (prefixLength + suffixLength + 2)) {
        return address;
    }
    
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Check if the given address is valid
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Compare two Ethereum addresses (case-insensitive)
 */
export function areAddressesEqual(address1: string, address2: string): boolean {
    if (!address1 || !address2) return false;
    return address1.toLowerCase() === address2.toLowerCase();
} 