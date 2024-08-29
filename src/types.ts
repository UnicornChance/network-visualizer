// src/types.ts

type Labels = { [key: string]: string };
type PolicyType = 'Ingress' | 'Egress';

export interface PolicyRelationship {
    policyName: string;
    namespace: string;
    podName: string;
    direction: string;
    relatedNamespace: string;
    relatedPod: string;
}

export interface Namespace {
    type: 'namespace';
    name: string;
    pods: Set<string>;
    x?: number; // X position in the D3 simulation
    y?: number; // Y position in the D3 simulation
    size: number;
}

export interface Port {
    port: number;
    protocol: string;
}

export interface NamespaceSelector {
    matchLabels: Labels;
}

export interface PodSelector {
    matchLabels: Labels;
}

export interface Egress {
    ports?: Port[];
    to?: {
        namespaceSelector?: NamespaceSelector;
        podSelector?: PodSelector;
        ipBlock?: {
            cidr: string;
            except?: string[];
        };
    }[];
}

export interface Ingress {
    from?: {
        namespaceSelector?: NamespaceSelector;
        podSelector?: PodSelector;
        ipBlock?: {
            cidr: string;
            except?: string[];
        };
    }[];
    ports?: Port[];
}

export interface K8sNetworkPolicy {
    metadata: {
        name: string;
        namespace: string;
        annotations?: Labels;
        creationTimestamp: string;
        labels?: Labels;
        uid: string;
        resourceVersion: string;
        ownerReferences?: Array<{ uid: string }>;
    };
    spec: {
        podSelector: PodSelector;
        ingress?: Ingress[];
        egress?: Egress[];
        policyTypes?: PolicyType[];
    };
}

export interface Policy {
    name: string;
    namespace: string;
    description: string;
    creation: string;
    package: string;
    generation: string;
    policyUID: string;
    ownerUID: string;
    resourceVersion: string;
    podSelector: PodSelector;
    ingress: Ingress[];
    egress: Egress[];
    policyTypes: PolicyType[];
}

export interface NamespaceWithPods {
    namespace: string;
    pods: {
        name: string;
        labels: Labels;
    }[];
}

export interface FlatPolicy {
    name: string;
    namespace: string;
    description: string;
    creation: string;
    package: string;
    generation: string;
    policyUID: string;
    ownerUID: string;
    resourceVersion: string;
    podSelector: {
        matchLabels?: { [key: string]: string };
    };
    ingress?: {
        from?: {
            namespaceSelector?: { matchLabels: { [key: string]: string } };
            podSelector?: { matchLabels: { [key: string]: string } };
            ipBlock?: { cidr: string; except?: string[] };
        }[];
        ports?: { port: number; protocol: string }[];
    }[];
    egress?: {
        to?: {
            namespaceSelector?: { matchLabels: { [key: string]: string } };
            podSelector?: { matchLabels: { [key: string]: string } };
            ipBlock?: { cidr: string; except?: string[] };
        }[];
        ports?: { port: number; protocol: string }[];
    }[];
    policyTypes: PolicyType[];
}

export interface ValidationResult {
    policyName: string;
    namespace: string;
    type: "security" | "configuration";
    message: string;
}
