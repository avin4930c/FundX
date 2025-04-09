"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";
import { Milestone } from "@/types";
import {
    addMilestonesToFundraiser,
    calculateTotalMilestoneAmount,
} from "@/utils/fundraiserHelpers";

interface FundraiserFormProps {
    onSuccess: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (isSubmitting: boolean) => void;
}

interface MilestoneFormData {
    description: string;
    amount: string;
}

// Predefined categories for fundraisers
const CATEGORIES = [
    "Education",
    "Medical",
    "Charity",
    "Disaster Relief",
    "Community",
    "Technology",
    "Art",
    "Environment",
    "Business",
    "Other",
];

export default function FundraiserForm({
    onSuccess,
    isSubmitting,
    setIsSubmitting,
}: FundraiserFormProps) {
    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        targetAmount: "",
        category: "",
        contactEmail: "",
        duration: "30", // Default 30 days
        tags: "",
    });

    // Milestone state
    const [milestones, setMilestones] = useState<MilestoneFormData[]>([]);
    const [currentMilestone, setCurrentMilestone] = useState<MilestoneFormData>(
        {
            description: "",
            amount: "",
        }
    );
    const [milestoneError, setMilestoneError] = useState("");
    const [remainingAmount, setRemainingAmount] = useState<string>("0");

    // Form errors
    const [errors, setErrors] = useState<{
        title?: string;
        description?: string;
        targetAmount?: string;
        category?: string;
        milestones?: string;
        contactEmail?: string;
    }>({});

    // UI states
    const [step, setStep] = useState(1); // 1: Basic Info, 2: Milestones, 3: Preview
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [previewMode, setPreviewMode] = useState(false);

    // Contract interactions
    const { writeContract, data: createHash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isCreateSuccess } =
        useWaitForTransactionReceipt({
            hash: createHash,
        });

    // Read contract for fundraiser count (to get the latest ID)
    const { data: fundraiserCount, refetch: refetchCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: "getFundraiserCount",
    });

    // Calculate remaining amount for milestones
    useEffect(() => {
        if (formData.targetAmount) {
            const targetAmount = parseFloat(formData.targetAmount);
            const allocatedAmount = milestones.reduce(
                (sum: number, milestone: MilestoneFormData) =>
                    sum + (parseFloat(milestone.amount) || 0),
                0
            );

            const remaining = Math.max(0, targetAmount - allocatedAmount);
            setRemainingAmount(remaining.toFixed(4));
        }
    }, [formData.targetAmount, milestones]);

    // Handle transaction success
    useEffect(() => {
        if (isCreateSuccess && createHash) {
            // If there are milestones, add them now that the fundraiser is created
            if (milestones.length > 0) {
                const addMilestones = async () => {
                    try {
                        // Refetch the fundraiser count to get the latest ID
                        await refetchCount();

                        // The ID of the new fundraiser is (count - 1)
                        const newFundraiserId =
                            (Number(fundraiserCount) || 0) - 1;

                        console.log(
                            "Adding milestones for fundraiser ID:",
                            newFundraiserId
                        );

                        // Add milestones to the fundraiser
                        await addMilestonesToFundraiser(
                            writeContract,
                            FUND_ALLOCATION_ADDRESS,
                            BigInt(newFundraiserId),
                            milestones
                        );

                        setSuccessMessage(
                            "Fundraiser and milestones created successfully! You will be redirected to the homepage in a moment."
                        );
                    } catch (error) {
                        console.error("Error adding milestones:", error);
                        setErrorMessage(
                            "Fundraiser was created, but there was an error adding milestones."
                        );
                    } finally {
                        setIsSubmitting(false);

                        // Redirect after delay
                        setTimeout(() => {
                            console.log(
                                "Redirecting after successful fundraiser creation"
                            );
                            onSuccess();
                        }, 3000);
                    }
                };

                addMilestones();
            } else {
                setSuccessMessage(
                    "Fundraiser created successfully! You will be redirected to the homepage in a moment."
                );

                // Clear form
                setFormData({
                    title: "",
                    description: "",
                    targetAmount: "",
                    category: "",
                    contactEmail: "",
                    duration: "30",
                    tags: "",
                });

                setIsSubmitting(false);

                // Redirect after delay
                setTimeout(() => {
                    console.log(
                        "Redirecting after successful fundraiser creation"
                    );
                    onSuccess();
                }, 3000);
            }
        }
    }, [
        isCreateSuccess,
        createHash,
        onSuccess,
        setIsSubmitting,
        milestones,
        writeContract,
        fundraiserCount,
        refetchCount,
    ]);

    // Handle form input changes
    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error when field is edited
        if (errors[name as keyof typeof errors]) {
            setErrors({
                ...errors,
                [name]: undefined,
            });
        }
    };

    // Handle milestone input changes
    const handleMilestoneChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setCurrentMilestone({
            ...currentMilestone,
            [name]: value,
        });
        setMilestoneError("");
    };

    // Add milestone to list
    const handleAddMilestone = () => {
        // Validate milestone
        if (!currentMilestone.description.trim()) {
            setMilestoneError("Description is required");
            return;
        }

        if (
            !currentMilestone.amount.trim() ||
            parseFloat(currentMilestone.amount) <= 0
        ) {
            setMilestoneError("Amount must be a positive number");
            return;
        }

        // Check if total milestone amounts exceed target amount
        const currentAmount = parseFloat(currentMilestone.amount);
        const totalAmount = milestones.reduce(
            (sum: number, m: MilestoneFormData) => sum + parseFloat(m.amount),
            currentAmount
        );

        if (totalAmount > parseFloat(formData.targetAmount || "0")) {
            setMilestoneError(
                "Total milestone amounts cannot exceed target amount"
            );
            return;
        }

        // Add milestone
        setMilestones([...milestones, { ...currentMilestone }]);

        // Clear current milestone
        setCurrentMilestone({
            description: "",
            amount: "",
        });
    };

    // Remove milestone
    const handleRemoveMilestone = (index: number) => {
        setMilestones(
            milestones.filter((_: MilestoneFormData, i: number) => i !== index)
        );
    };

    // Validate form basics (step 1)
    const validateBasicInfo = () => {
        const newErrors: {
            title?: string;
            description?: string;
            targetAmount?: string;
            category?: string;
            contactEmail?: string;
        } = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        } else if (formData.description.length < 30) {
            newErrors.description =
                "Description should be at least 30 characters";
        }

        if (!formData.targetAmount) {
            newErrors.targetAmount = "Target amount is required";
        } else if (
            isNaN(parseFloat(formData.targetAmount)) ||
            parseFloat(formData.targetAmount) <= 0
        ) {
            newErrors.targetAmount = "Target amount must be a positive number";
        }

        if (!formData.category) {
            newErrors.category = "Please select a category";
        }

        if (
            formData.contactEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
        ) {
            newErrors.contactEmail = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate milestones (step 2)
    const validateMilestones = () => {
        const newErrors: { milestones?: string } = {};

        // Milestones are optional, but if any are added, they need to allocate all funds
        if (milestones.length > 0) {
            const totalAllocated = calculateTotalMilestoneAmount(milestones);
            const targetAmount = parseFloat(formData.targetAmount);

            if (Math.abs(totalAllocated - targetAmount) > 0.001) {
                newErrors.milestones =
                    "Milestone amounts should add up to the target amount";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigate to next step
    const goToNextStep = () => {
        if (step === 1) {
            if (validateBasicInfo()) {
                setStep(2);
            }
        } else if (step === 2) {
            if (validateMilestones()) {
                setStep(3);
                setPreviewMode(true);
            }
        }
    };

    // Go back to previous step
    const goToPreviousStep = () => {
        if (step > 1) {
            setStep(step - 1);
            setPreviewMode(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Final validation
        if (step !== 3) {
            goToNextStep();
            return;
        }

        // Reset messages
        setSuccessMessage("");
        setErrorMessage("");

        try {
            setIsSubmitting(true);

            // Validate contract address
            if (!FUND_ALLOCATION_ADDRESS || FUND_ALLOCATION_ADDRESS === "") {
                throw new Error(
                    "Contract address is not configured. Please check your environment variables."
                );
            }

            // Validate target amount is a proper number
            const targetAmount = parseFloat(formData.targetAmount);
            if (isNaN(targetAmount) || targetAmount <= 0) {
                throw new Error("Target amount must be greater than 0");
            }

            // Convert form values to appropriate types for the contract call
            // Ensure we're using a valid number by parsing first and handling any potential errors
            let targetAmountInWei;
            try {
                targetAmountInWei = parseEther(formData.targetAmount);

                // Double check it's greater than zero
                if (targetAmountInWei <= 0n) {
                    throw new Error("Target amount must be greater than 0");
                }
            } catch (err) {
                console.error("Error converting amount to wei:", err);
                throw new Error(
                    "Invalid target amount format. Please enter a valid number."
                );
            }

            console.log("Creating fundraiser with data:", {
                title: formData.title,
                description: formData.description,
                targetAmount: formData.targetAmount,
                targetAmountWei: targetAmountInWei.toString(),
                contractAddress: FUND_ALLOCATION_ADDRESS,
                milestones: milestones.length,
            });

            // Call the contract to create fundraiser with explicit gas limit to avoid underestimation
            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "createFundraiser",
                args: [formData.title, formData.description, targetAmountInWei],
                // Add gas limit with some buffer to avoid underestimation
                gas: 500000n,
            });

            console.log("Fundraiser creation transaction submitted:", tx);

            // Add milestones in next step
            // The milestone addition will be done after the fundraiser is created successfully
        } catch (error) {
            console.error("Error submitting transaction:", error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // User-friendly error messages
            if (errorMessage.includes("user rejected")) {
                setErrorMessage("Transaction was rejected in your wallet");
            } else if (errorMessage.includes("insufficient funds")) {
                setErrorMessage(
                    "You don't have enough ETH in your wallet for this transaction"
                );
            } else if (errorMessage.includes("Internal JSON-RPC error")) {
                // Contract revert with specific error handling
                if (
                    errorMessage.includes(
                        "Target amount must be greater than 0"
                    )
                ) {
                    setErrorMessage("Target amount must be greater than 0");
                } else {
                    setErrorMessage(
                        "Transaction failed. This might be due to contract constraints."
                    );
                }
            } else {
                setErrorMessage(
                    `Failed to submit transaction: ${errorMessage}`
                );
            }

            setIsSubmitting(false);
        }
    };

    // Render milestone form section
    const renderMilestoneSection = () => (
        <div className="space-y-6 mt-6 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Milestones (Optional)
            </h3>

            <p className="text-sm text-gray-500 dark:text-gray-400">
                Milestones help break down your fundraiser into achievable
                goals. Donors can track progress and release funds as you
                complete each milestone.
            </p>

            {/* Remaining amount display */}
            <div className="text-sm bg-blue-50 dark:bg-blue-900 p-3 rounded">
                <p className="text-blue-800 dark:text-blue-200">
                    Target Amount: {formData.targetAmount} ETH | Remaining to
                    allocate: {remainingAmount} ETH
                </p>
            </div>

            {/* Milestone input form */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div>
                    <label
                        htmlFor="milestone-description"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Milestone Description
                    </label>
                    <textarea
                        id="milestone-description"
                        name="description"
                        rows={2}
                        value={currentMilestone.description}
                        onChange={handleMilestoneChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="e.g., Complete initial research"
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label
                        htmlFor="milestone-amount"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount (ETH)
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="number"
                            id="milestone-amount"
                            name="amount"
                            step="0.0001"
                            min="0.0001"
                            max={remainingAmount}
                            value={currentMilestone.amount}
                            onChange={handleMilestoneChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Amount in ETH"
                            disabled={isSubmitting}
                        />
                        <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                            ETH
                        </span>
                    </div>
                </div>

                {milestoneError && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {milestoneError}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={
                        isSubmitting ||
                        !currentMilestone.description ||
                        !currentMilestone.amount
                    }>
                    Add Milestone
                </button>
            </div>

            {/* Milestone list */}
            {milestones.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Milestones ({milestones.length})
                    </h4>
                    <ul className="space-y-3">
                        {milestones.map((milestone, index) => (
                            <li
                                key={index}
                                className="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-md shadow-sm">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800 dark:text-white">
                                        {milestone.description}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {milestone.amount} ETH
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMilestone(index)}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    disabled={isSubmitting}>
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>

                    {errors.milestones && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {errors.milestones}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    // Render preview section
    const renderPreview = () => (
        <div className="space-y-6 mt-6 border-t pt-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                Preview Your Fundraiser
            </h3>

            <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-blue-600 text-white">
                    <h2 className="text-2xl font-bold">{formData.title}</h2>
                    <div className="flex items-center mt-2">
                        <span className="px-2 py-1 text-xs rounded bg-blue-700">
                            {formData.category}
                        </span>
                        <span className="ml-4 text-sm opacity-75">
                            Duration: {formData.duration} days
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Description
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                            {formData.description}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Funding Goal
                        </h3>
                        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {formData.targetAmount} ETH
                        </p>
                    </div>

                    {milestones.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Milestones
                            </h3>
                            <div className="mt-3 space-y-3">
                                {milestones.map((milestone, index) => (
                                    <div
                                        key={index}
                                        className="p-3 border border-gray-200 dark:border-gray-600 rounded">
                                        <div className="flex justify-between">
                                            <h4 className="font-medium text-gray-800 dark:text-white">
                                                Milestone {index + 1}
                                            </h4>
                                            <span className="text-gray-600 dark:text-gray-300">
                                                {milestone.amount} ETH
                                            </span>
                                        </div>
                                        <p className="mt-1 text-gray-600 dark:text-gray-300 text-sm">
                                            {milestone.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.tags && (
                        <div className="mt-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tags
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.tags.split(",").map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Render form content based on step
    const renderFormContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Fundraiser Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.title ? "border-red-500" : ""
                                }`}
                                placeholder="Enter a compelling title"
                                disabled={isSubmitting || isConfirming}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.description ? "border-red-500" : ""
                                }`}
                                placeholder="Describe your fundraiser in detail. What will the funds be used for? Why should people donate?"
                                disabled={isSubmitting || isConfirming}
                            />
                            {errors.description && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="targetAmount"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Target Amount (ETH) *
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="number"
                                    id="targetAmount"
                                    name="targetAmount"
                                    step="0.0001"
                                    min="0.0001"
                                    value={formData.targetAmount}
                                    onChange={handleChange}
                                    className={`block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                        errors.targetAmount
                                            ? "border-red-500"
                                            : ""
                                    }`}
                                    placeholder="1.0"
                                    disabled={isSubmitting || isConfirming}
                                />
                                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300">
                                    ETH
                                </span>
                            </div>
                            {errors.targetAmount && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.targetAmount}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="category"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Category *
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.category ? "border-red-500" : ""
                                }`}
                                disabled={isSubmitting || isConfirming}>
                                <option value="">Select a category</option>
                                {CATEGORIES.map((category) => (
                                    <option
                                        key={category}
                                        value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.category}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="duration"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Duration (days)
                            </label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                min="1"
                                max="365"
                                value={formData.duration}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                disabled={isSubmitting || isConfirming}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="contactEmail"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Contact Email (Optional)
                            </label>
                            <input
                                type="email"
                                id="contactEmail"
                                name="contactEmail"
                                value={formData.contactEmail}
                                onChange={handleChange}
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.contactEmail ? "border-red-500" : ""
                                }`}
                                placeholder="your@email.com"
                                disabled={isSubmitting || isConfirming}
                            />
                            {errors.contactEmail && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.contactEmail}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="tags"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Tags (Optional, comma separated)
                            </label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="e.g., sustainability, education, research"
                                disabled={isSubmitting || isConfirming}
                            />
                        </div>
                    </>
                );
            case 2:
                return renderMilestoneSection();
            case 3:
                return renderPreview();
            default:
                return null;
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md">
                    <p className="text-green-800 dark:text-green-200">
                        {successMessage}
                    </p>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
                    <p className="text-red-800 dark:text-red-200">
                        {errorMessage}
                    </p>
                </div>
            )}

            {/* Progress steps */}
            <div className="flex items-center justify-between mb-6">
                <ol className="flex items-center w-full">
                    <li
                        className={`flex items-center ${
                            step >= 1
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}>
                        <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                step >= 1
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "bg-gray-100 dark:bg-gray-700"
                            }`}>
                            1
                        </span>
                        <span className="ml-2 text-sm">Basic Info</span>
                    </li>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <li
                        className={`flex items-center ${
                            step >= 2
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}>
                        <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                step >= 2
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "bg-gray-100 dark:bg-gray-700"
                            }`}>
                            2
                        </span>
                        <span className="ml-2 text-sm">Milestones</span>
                    </li>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <li
                        className={`flex items-center ${
                            step >= 3
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                        }`}>
                        <span
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                step >= 3
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : "bg-gray-100 dark:bg-gray-700"
                            }`}>
                            3
                        </span>
                        <span className="ml-2 text-sm">Preview</span>
                    </li>
                </ol>
            </div>

            {/* Form content */}
            <div className="space-y-6">{renderFormContent()}</div>

            {/* Form actions */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={goToPreviousStep}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                        disabled={isSubmitting || isConfirming}>
                        Back
                    </button>
                ) : (
                    <div></div> // Empty div to maintain flex spacing
                )}

                <button
                    type={step === 3 ? "submit" : "button"}
                    onClick={step !== 3 ? goToNextStep : undefined}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={isSubmitting || isConfirming}>
                    {isSubmitting || isConfirming ? (
                        <span className="flex items-center">
                            <svg
                                className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </span>
                    ) : step === 3 ? (
                        "Create Fundraiser"
                    ) : (
                        "Next"
                    )}
                </button>
            </div>
        </form>
    );
}
