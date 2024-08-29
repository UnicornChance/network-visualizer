// src/lib/utils/mapPolicyData.ts

import type { K8sNetworkPolicy, Policy } from "../../../types";

export function mapK8sPolicyToCustomStructure(policy: K8sNetworkPolicy): Policy {
  return {
    name: policy.metadata.name,
    namespace: policy.metadata.namespace,
    description: policy.metadata.annotations?.["uds/description"] || "",
    creation: policy.metadata.creationTimestamp,
    package: policy.metadata.labels?.["uds/package"] || "",
    generation: policy.metadata.labels?.["uds/generation"] || "",
    policyUID: policy.metadata.uid,
    ownerUID: policy.metadata.ownerReferences?.[0]?.uid || "",
    resourceVersion: policy.metadata.resourceVersion,
    podSelector: policy.spec.podSelector || { matchLabels: {} },
    ingress: policy.spec.ingress || [],
    egress: policy.spec.egress || [],
    policyTypes: policy.spec.policyTypes || [],
  };
}
