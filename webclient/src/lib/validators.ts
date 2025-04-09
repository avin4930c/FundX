// Validator addresses for the multisig system
export const VALIDATOR_ADDRESSES = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Validator 1
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Validator 2
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Validator 3 
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906"  // Validator 4
];

// Helper function to check if an address is a validator
export const isValidatorAddress = (address?: string): boolean => {
    if (!address) return false;
    
    return VALIDATOR_ADDRESSES.some(
        (validator) => validator.toLowerCase() === address.toLowerCase()
    );
};

// Helper function to check if the current user is the fundraiser creator
export const isFundraiserCreator = (creatorAddress?: string, currentAddress?: string): boolean => {
    if (!creatorAddress || !currentAddress) return false;
    
    return creatorAddress.toLowerCase() === currentAddress.toLowerCase();
}; 