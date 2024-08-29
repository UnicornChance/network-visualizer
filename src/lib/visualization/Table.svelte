<!-- Table.svelte -->
<script lang="ts">
    import type { Policy } from "../types";

    export let policies: Policy[];

    console.log("netpols", policies);

    function getPortsAndProtocols(
        rules: { ports?: { port: number; protocol: string }[] }[],
    ): string {
        return rules
            .flatMap((rule) => rule.ports || [])
            .map((port) => `${port.port}/${port.protocol}`)
            .join(", ");
    }

    function formatFrom(rules: {
        from: {
            namespaceSelector?: { matchLabels: { [key: string]: string } };
            podSelector?: { matchLabels: { [key: string]: string } };
            ipBlock?: { cidr: string; except?: string[] };
        }[];
    }): string {
        return rules
            .flatMap((rule) => rule.from || [])
            .map((fromRule) => {
                const selectors = [];
                if (fromRule.namespaceSelector) {
                    selectors.push(
                        `Namespace: ${JSON.stringify(fromRule.namespaceSelector.matchLabels)}`,
                    );
                }
                if (fromRule.podSelector) {
                    selectors.push(
                        `Pod: ${JSON.stringify(fromRule.podSelector.matchLabels)}`,
                    );
                }
                if (fromRule.ipBlock) {
                    selectors.push(
                        `IPBlock: ${fromRule.ipBlock.cidr}${fromRule.ipBlock.except ? ` (except: ${fromRule.ipBlock.except.join(", ")})` : ""}`,
                    );
                }
                return selectors.join("; ");
            })
            .join(" | ");
    }

    function formatTo(rules: {
        to: {
            namespaceSelector?: { matchLabels: { [key: string]: string } };
            podSelector?: { matchLabels: { [key: string]: string } };
            ipBlock?: { cidr: string; except?: string[] };
        }[];
    }): string {
        return rules
            .flatMap((rule) => rule.to || [])
            .map((toRule) => {
                const selectors = [];
                if (toRule.namespaceSelector) {
                    selectors.push(
                        `Namespace: ${JSON.stringify(toRule.namespaceSelector.matchLabels)}`,
                    );
                }
                if (toRule.podSelector) {
                    selectors.push(
                        `Pod: ${JSON.stringify(toRule.podSelector.matchLabels)}`,
                    );
                }
                if (toRule.ipBlock) {
                    selectors.push(
                        `IPBlock: ${toRule.ipBlock.cidr}${toRule.ipBlock.except ? ` (except: ${toRule.ipBlock.except.join(", ")})` : ""}`,
                    );
                }
                return selectors.join("; ");
            })
            .join(" | ");
    }
</script>

<div class="table-container">
    <table>
        <thead class="sticky-header">
            <tr>
                <th>Name</th>
                <th>Namespace</th>
                <th>Description</th>
                <th>Creation</th>
                <th>Package</th>
                <th>Generation</th>
                <th>Resource Version</th>
                <th>Ingress Ports</th>
                <th>Egress Ports</th>
                <th>Ingress From</th>
                <th>Egress To</th>
                <th>Policy UID</th>
                <th>Owner UID</th>
            </tr>
        </thead>
        <tbody>
            {#each policies as policy}
                <tr>
                    <td>{policy.name}</td>
                    <td>{policy.namespace}</td>
                    <td>{policy.description}</td>
                    <td>{new Date(policy.creation).toLocaleString()}</td>
                    <td>{policy.package}</td>
                    <td>{policy.generation}</td>
                    <td>{policy.resourceVersion}</td>
                    <td>{getPortsAndProtocols(policy.ingress)}</td>
                    <td>{getPortsAndProtocols(policy.egress)}</td>
                    <td>{formatFrom(policy.ingress)}</td>
                    <td>{formatTo(policy.egress)}</td>
                    <td>{policy.policyUID}</td>
                    <td>{policy.ownerUID}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    .table-container {
        max-height: 800px;
        overflow-y: auto;
        position: relative;
        margin: 5% 0;
        border: 1px solid #fff;
        display: flex;
        flex-direction: column;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        flex-grow: 1;
    }

    tbody {
        min-height: 100px;
    }

    td {
        border: 1px solid #ddd;
        padding: 10px;
        word-wrap: break-word;
    }

    th {
        background-color: #333;
        color: #fff;
        position: sticky;
        top: 0;
        z-index: 2;
        border: 1px solid #fff;
    }

    th,
    td {
        min-width: 100px;
        max-width: 300px;
    }
</style>
