// src/networkValidator.ts

import type { FlatPolicy, PolicyRelationship, ValidationResult } from "../../types";

/**
 * Checks if a given IP address is within a specified CIDR block.
 *
 * @param {string} ip - The IP address to check.
 * @param {string} cidr - The CIDR block to check against.
 * @returns {boolean} True if the IP is within the CIDR block, otherwise false.
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, subnet] = cidr.split('/');
  if (!range || !subnet) return false;

  const ipParts = ip.split('.').map(Number);
  const rangeParts = range.split('.').map(Number);
  const mask = ~(Math.pow(2, 32 - parseInt(subnet)) - 1);

  const ipLong = ipParts.reduce((acc, part) => (acc << 8) + part, 0);
  const rangeLong = rangeParts.reduce((acc, part) => (acc << 8) + part, 0);

  return (ipLong & mask) === (rangeLong & mask);
}

/**
 * Matches labels between a policy and a pod.
 *
 * @param {Object.<string, string>} [policyLabels] - The labels defined in the policy.
 * @param {Object.<string, string>} [podLabels] - The labels defined in the pod.
 * @returns {boolean} True if all policy labels match the pod labels, otherwise false.
 */
function matchLabels(policyLabels: { [key: string]: string } | undefined, podLabels: { [key: string]: string } | undefined): boolean {
  if (!policyLabels || Object.keys(policyLabels).length === 0) return true;
  if (!podLabels) return false;

  return Object.entries(policyLabels).every(([key, value]) => podLabels[key] === value);
}

/**
 * Validates if both Ingress and Egress are defined without a podSelector.
 *
 * @param {FlatPolicy} policy - The network policy to validate.
 * @returns {string | null} A message describing the issue if validation fails, otherwise null.
 */
function validatePolicyTypeWithoutPodSelector(policy: FlatPolicy): string | null {
  const { name, namespace, podSelector, policyTypes } = policy;

  const isLockedDown = policyTypes.includes("Ingress") && policyTypes.includes("Egress") && Object.keys(podSelector?.matchLabels || {}).length === 0;

  if (isLockedDown) {
    // Do not flag overly restrictive policies (Ingress + Egress with empty podSelector) as risky
    return null;
  }

  // If not locked down, we can continue with the original validation logic
  if (policyTypes.includes("Ingress") && policyTypes.includes("Egress") && Object.keys(podSelector?.matchLabels || {}).length === 0) {
    return `Policy '${name}' in namespace '${namespace}' has both Ingress and Egress defined without a podSelector, which could be risky.`;
  }

  return null;
}

/**
 * Matches pod names directly between a policy and a pod.
 *
 * @param {string} podName - The name of the pod in the policy.
 * @param {string} relatedPodName - The name of the related pod.
 * @returns {boolean} True if the pod names match, otherwise false.
 */
function matchPodName(podName: string, relatedPodName: string): boolean {
  return podName === relatedPodName;
}

/**
 * Validates ingress rules by checking if the policy correctly allows traffic from specified sources.
 *
 * @param {FlatPolicy} policy - The network policy to validate.
 * @param {PolicyRelationship[]} relationships - The policy relationships to validate against.
 * @returns {string[]} An array of issues found with the ingress rules.
 */
function validateIngressRules(policy: FlatPolicy, relationships: PolicyRelationship[]): string[] {
  const issues: string[] = [];
  const { name, namespace, ingress } = policy;

  relationships.forEach(relationship => {
    if (relationship.policyName === name && relationship.namespace === namespace && relationship.direction === "Ingress") {
      const matchingIngress = ingress?.some(ingressRule =>
        ingressRule.from?.some(fromRule =>
          (
            fromRule.namespaceSelector?.matchLabels["kubernetes.io/metadata.name"] === relationship.relatedNamespace &&
            (matchLabels(fromRule.podSelector?.matchLabels, { app: relationship.relatedPod }) ||
             matchPodName(relationship.relatedPod, relationship.relatedPod)) 
          )
        )
      );

      if (!matchingIngress) {
        issues.push(`Policy '${name}' in namespace '${namespace}' does not properly allow ingress from '${relationship.relatedNamespace}/${relationship.relatedPod}'.`);
      }
    }
  });

  return issues;
}

/**
 * Validates egress rules by checking if the policy correctly allows traffic to specified destinations.
 *
 * @param {FlatPolicy} policy - The network policy to validate.
 * @param {PolicyRelationship[]} relationships - The policy relationships to validate against.
 * @returns {string[]} An array of issues found with the egress rules.
 */
function validateEgressRules(policy: FlatPolicy, relationships: PolicyRelationship[]): string[] {
  const issues: string[] = [];
  const { name, namespace, egress } = policy;

  relationships.forEach(relationship => {
    if (relationship.policyName === name && relationship.namespace === namespace && relationship.direction === "Egress") {
      const matchingEgress = egress?.some(egressRule =>
        egressRule.to?.some(toRule =>
          (toRule.ipBlock && isIPInCIDR(relationship.relatedPod, toRule.ipBlock.cidr)) ||
          (
            toRule.namespaceSelector?.matchLabels["kubernetes.io/metadata.name"] === relationship.relatedNamespace &&
            (matchLabels(toRule.podSelector?.matchLabels, { app: relationship.relatedPod }) ||
             matchPodName(relationship.relatedPod, relationship.relatedPod)) 
          )
        )
      );

      if (!matchingEgress) {
        issues.push(`Policy '${name}' in namespace '${namespace}' does not properly allow egress to '${relationship.relatedNamespace}/${relationship.relatedPod}'.`);
      }
    }
  });

  return issues;
}

/**
 * Validates CIDR blocks in a policy for correctness.
 *
 * @param {FlatPolicy} policy - The network policy to validate.
 * @returns {string[]} An array of issues found with the CIDR blocks.
 */
function validateCIDRBlocks(policy: FlatPolicy): string[] {
  const issues: string[] = [];
  const { name, namespace, egress } = policy;

  egress?.forEach(egressRule => {
    egressRule.to?.forEach(toRule => {
      if (toRule.ipBlock && !/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(toRule.ipBlock.cidr)) {
        issues.push(`Policy '${name}' in namespace '${namespace}' has an invalid CIDR block: '${toRule.ipBlock.cidr}'.`);
      }
    });
  });

  return issues;
}

/**
 * Validates network policies against security best practices.
 *
 * @param {FlatPolicy} policy - The network policy to validate.
 * @returns {string[]} An array of issues found with the policy's security practices.
 */
function validateSecurityBestPractices(policy: FlatPolicy): string[] {
  const issues: string[] = [];
  const { name, namespace, egress, ingress } = policy;

  if (egress?.some(egressRule =>
      egressRule.to?.some(toRule => toRule.ipBlock?.cidr === '0.0.0.0/0'))) {
      issues.push(`Policy '${name}' in namespace '${namespace}' is overly permissive in egress rules, allowing traffic to all IPs (0.0.0.0/0). Consider tightening this rule.`);
  }

  if (ingress?.some(ingressRule => ingressRule.from?.length === 0)) {
      issues.push(`Policy '${name}' in namespace '${namespace}' denies all ingress traffic. Ensure this is the intended configuration.`);
  }

  return issues;
}

/**
 * Validates the provided network policies by running various checks and returns a list of identified issues.
 *
 * @param {FlatPolicy[]} networkPolicies - The network policies to validate.
 * @param {PolicyRelationship[]} relationships - The policy relationships to validate against.
 * @returns {ValidationResult[]} An array of validation results, each describing an identified issue.
 */
export function validateNetworkPolicies(
  networkPolicies: FlatPolicy[],
  relationships: PolicyRelationship[]
): ValidationResult[] {
  const issues: ValidationResult[] = [];

  networkPolicies.forEach(policy => {
    const { name, namespace } = policy;

    const policyTypeIssues = validatePolicyTypeWithoutPodSelector(policy);
    if (policyTypeIssues) {
      issues.push({
        policyName: name,
        namespace,
        type: "configuration",
        message: policyTypeIssues
      });
    }

    const ingressIssues = validateIngressRules(policy, relationships);
    ingressIssues.forEach(issue => {
      issues.push({
        policyName: name,
        namespace,
        type: "configuration",
        message: issue
      });
    });

    const egressIssues = validateEgressRules(policy, relationships);
    egressIssues.forEach(issue => {
      issues.push({
        policyName: name,
        namespace,
        type: "configuration",
        message: issue
      });
    });

    const cidrIssues = validateCIDRBlocks(policy);
    cidrIssues.forEach(issue => {
      issues.push({
        policyName: name,
        namespace,
        type: "configuration",
        message: issue
      });
    });

    const securityIssues = validateSecurityBestPractices(policy);
    securityIssues.forEach(issue => {
      issues.push({
        policyName: name,
        namespace,
        type: "security",
        message: issue
      });
    });
  });

  return issues;
}
