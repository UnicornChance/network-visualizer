# Kubernetes Network Policy API

This Node.js application provides an API to fetch and display relationships between Kubernetes network policies and pods. It is built using the Express.js framework and the Kubernetes client-node library.

## Features

- Fetches all network policies across all namespaces in a Kubernetes cluster.
- Processes both ingress and egress rules of each network policy.
- Extracts relationships between network policies and pods, including those related by pod selectors, namespace selectors, and IP blocks.
- Returns the structured data as a JSON response.

## Requirements

- Node.js (>= 12.x)
- Access to a Kubernetes cluster (with `kubectl` configured)
- npm package dependencies listed in `package.json`

## Installation

1. **Clone the repository:**

   ```bash
    git clone https://github.com/your-username/k8s-network-policy-api.git
    cd k8s-network-policy-api
   ```

2. **Install dependencies:**

   ```bash
    npm install
   ```

3. **Ensure Kubernetes access:**

   Make sure your `kubectl` is configured to access the Kubernetes cluster. The application uses your default kubeconfig context.

## Running the Application

1. **Start the server:**

   ```bash
   npm start
   ```

2. **Access the API:**

   The server will be running on `http://localhost:3000`. You can access the network policies and relationships via:

   ```http
    GET /api/network-policies
   ```

## API Endpoint

### `GET /api/network-policies`

Fetches all network policies and their relationships to pods within a Kubernetes cluster.

#### Response Format

```json
    {
        "networkPolicies": [
            {
            "policy": {
                // Full network policy object
            }
            }
        ],
        "relationships": [
            {
                "policyName": "string",
                "namespace": "string",
                "podName": "string",
                "direction": "Egress | Ingress",
                "relatedNamespace": "string",
                "relatedPod": "string"
            }
        ]
    }
```

- **`networkPolicies`**: List of network policies retrieved from the cluster.
- **`relationships`**: List of pod relationships for each policy, detailing how pods are allowed to communicate based on the policies.

## Error Handling

If there is an issue fetching the network policies or pods, the API will respond with a `500` status code and a JSON object containing the error message.
