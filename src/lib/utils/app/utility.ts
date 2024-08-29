// utils/app/utility.ts
import { get } from 'svelte/store';
import { mapK8sPolicyToCustomStructure } from "./mapPolicyData";
import { validateNetworkPolicies } from "../../validation/networkValidator";
import { networkPolicies, rawRelationships, problems, hasSecurityIssues, hasConfigurationIssues } from "../../../stores";
import type { Policy, PolicyRelationship, ValidationResult } from "../../../types";

/**
 * Fetches network policies and relationships from the backend or mock data, 
 * processes and validates them, and updates the corresponding Svelte stores.
 * 
 * @returns A promise that resolves to an object containing the fetched and processed 
 * network policies and raw relationships, or `null` if fetching fails.
 */
export const fetchData = async (): Promise<{ networkPolicies: Policy[], rawRelationships: PolicyRelationship[] } | null> => {
    try {
        let rawPolicies: any;
        if (import.meta.env.VITE_MOCK_DATA) {
            rawPolicies = await import("../../../mockData/liveUdsCore.json");
        } else {
            const response = await fetch("http://localhost:3000/api/network-policies");
            if (response.ok) {
                rawPolicies = await response.json();
            } else {
                console.error("Failed to load network policies");
                return null;
            }
        }

        const policies = rawPolicies.networkPolicies.map((item: any) =>
            mapK8sPolicyToCustomStructure(item.policy)
        );
        const relationships = rawPolicies.relationships;

        networkPolicies.set(policies);
        rawRelationships.set(relationships);

        const validationResults = validateNetworkPolicies(policies, relationships);
        problems.set(validationResults);

        updateIconTypes();

        return { networkPolicies: policies, rawRelationships: relationships };
    } catch (error) {
        console.error("Error fetching network policies:", error);
        return null;
    }
};

/**
 * Updates the icon types in the UI based on the validation results.
 * 
 * Sets the `hasSecurityIssues` and `hasConfigurationIssues` stores based on 
 * the types of problems detected in the network policies.
 */
export const updateIconTypes = (): void => {
    const currentProblems = get(problems);
    hasSecurityIssues.set(currentProblems.some((p: ValidationResult) => p.type === "security"));
    hasConfigurationIssues.set(currentProblems.some((p: ValidationResult) => p.type === "configuration"));
};

/**
 * Refreshes the network policies data by calling the `fetchData` function.
 * 
 * @returns The result of the `fetchData` function.
 */
export const refreshData = fetchData;

/**
 * Closes a modal dialog by setting the `showModal` flag to `false`.
 * 
 * @param showModal - The current state of the modal visibility.
 * @returns `false`, indicating that the modal is closed.
 */
export const closeModal = (showModal: boolean): boolean => showModal = false;

/**
 * Shows a tooltip with details about security or configuration issues.
 * 
 * @param event - The mouse event triggering the tooltip.
 * @param type - The type of issues to display ("security" or "configuration").
 * @returns An object containing the content of the tooltip, its position, and visibility status.
 */
export function showTooltip(event: MouseEvent, type: "security" | "configuration"): {
    tooltipContent: ValidationResult[];
    tooltipPosition: { top: number, left: number };
    tooltipVisible: boolean;
} {
    const icon = (event.target as HTMLElement).getBoundingClientRect();
    const tooltipPosition = {
        top: icon.top + window.scrollY,
        left: icon.left + window.scrollX + icon.width / 2
    };
    
    const currentProblems = get(problems);  // Get the current value of the `problems` store
    const tooltipContent = currentProblems.filter(p => p.type === type);  // Filter the problems based on the type

    return { tooltipContent, tooltipPosition, tooltipVisible: true };
}

/**
 * Hides the tooltip by setting its visibility status to `false`.
 * 
 * @returns An object indicating that the tooltip is not visible.
 */
export function hideTooltip(): { tooltipVisible: boolean } {
    return { tooltipVisible: false };
}
