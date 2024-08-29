import { writable } from 'svelte/store';
import type { Policy, PolicyRelationship, ValidationResult } from './types';

export const networkPolicies = writable<Policy[]>([]);
export const rawRelationships = writable<PolicyRelationship[]>([]);
export const problems = writable<ValidationResult[]>([]);

export const hasSecurityIssues = writable(false);
export const hasConfigurationIssues = writable(false);

export const tooltipContent = writable<ValidationResult[]>([]);
export const tooltipPosition = writable({ top: 0, left: 0 });
export const tooltipVisible = writable(false);
