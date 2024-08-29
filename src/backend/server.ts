import express from 'express';
import cors from 'cors';
import { KubeConfig, NetworkingV1Api, CoreV1Api, V1NetworkPolicy } from '@kubernetes/client-node';
import type { PolicyRelationship } from '../types';

const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Initialize Kubernetes configuration and API clients
const kc = new KubeConfig();
kc.loadFromDefault();

const k8sNetworkingApi = kc.makeApiClient(NetworkingV1Api);
const k8sCoreApi = kc.makeApiClient(CoreV1Api);

app.get('/api/network-policies', async (req, res) => {
  try {
    // Fetch all network policies from all namespaces
    const networkPoliciesResult = await k8sNetworkingApi.listNetworkPolicyForAllNamespaces();
    const networkPolicies: V1NetworkPolicy[] = networkPoliciesResult.body.items;

    // Initialize an array to store policy relationships
    const relationships: PolicyRelationship[] = [];

    // Process each network policy
    for (const policy of networkPolicies) {
      const namespace = policy.metadata?.namespace || '';
      const policyName = policy.metadata?.name || '';

      // Process egress rules of the network policy
      if (policy.spec?.egress) {
        for (const rule of policy.spec.egress) {
          for (const to of rule.to || []) {
            if (to.podSelector && to.namespaceSelector) {
              // Extract the related namespace and fetch matching pods
              const relatedNamespace = to.namespaceSelector.matchLabels?.['kubernetes.io/metadata.name'];
              if (relatedNamespace) {
                const podResponse = await k8sCoreApi.listNamespacedPod(relatedNamespace);
                const relatedPods = podResponse.body.items.filter(pod =>
                  Object.entries(to.podSelector?.matchLabels || {}).every(
                    ([key, value]) => pod.metadata?.labels?.[key] === value
                  )
                );
                // Add each related pod to the relationships array
                for (const pod of relatedPods) {
                  relationships.push({
                    policyName,
                    namespace,
                    podName: policy.spec?.podSelector?.matchLabels?.['app.kubernetes.io/name'] || '',
                    direction: 'Egress',
                    relatedNamespace,
                    relatedPod: pod.metadata?.name || '',
                  });
                }
              }
            } else if (to.ipBlock) {
              // Handle egress to IP blocks
              relationships.push({
                policyName,
                namespace,
                podName: policy.spec?.podSelector?.matchLabels?.['app.kubernetes.io/name'] || '',
                direction: 'Egress',
                relatedNamespace: 'external',
                relatedPod: to.ipBlock.cidr,
              });
            }
          }
        }
      }

      // Process ingress rules of the network policy
      if (policy.spec?.ingress) {
        for (const rule of policy.spec.ingress) {
          for (const from of rule.from || []) {
            if (from.podSelector && from.namespaceSelector) {
              // Extract the related namespace and fetch matching pods
              const relatedNamespace = from.namespaceSelector.matchLabels?.['kubernetes.io/metadata.name'];
              if (relatedNamespace) {
                const podResponse = await k8sCoreApi.listNamespacedPod(relatedNamespace);
                const relatedPods = podResponse.body.items.filter(pod =>
                  Object.entries(from.podSelector?.matchLabels || {}).every(
                    ([key, value]) => pod.metadata?.labels?.[key] === value
                  )
                );
                // Add each related pod to the relationships array
                for (const pod of relatedPods) {
                  relationships.push({
                    policyName,
                    namespace,
                    podName: policy.spec?.podSelector?.matchLabels?.['app.kubernetes.io/name'] || '',
                    direction: 'Ingress',
                    relatedNamespace,
                    relatedPod: pod.metadata?.name || '',
                  });
                }
              }
            } else if (from.ipBlock) {
              // Handle ingress from IP blocks
              relationships.push({
                policyName,
                namespace,
                podName: policy.spec?.podSelector?.matchLabels?.['app.kubernetes.io/name'] || '',
                direction: 'Ingress',
                relatedNamespace: 'external',
                relatedPod: from.ipBlock.cidr,
              });
            }
          }
        }
      }
    }

    // Structure the response with network policies and relationships
    const response = {
      networkPolicies: networkPolicies.map(policy => ({ policy })),
      relationships,
    };

    // Send the structured response as JSON
    res.json(response);
  } catch (error) {
    // Handle and log errors
    console.error('Error fetching network policies or pods:', error);
    res.status(500).json({ error: 'Failed to fetch network policies or pods' });
  }
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
