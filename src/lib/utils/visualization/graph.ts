import type { PolicyRelationship, Namespace } from "../../../types";
import * as d3 from "d3";

type NamespaceGroupSelection = d3.Selection<SVGGElement, Namespace, SVGGElement, unknown>;
type LinkSelection = d3.Selection<SVGLineElement, PolicyRelationship, SVGGElement, unknown>;

/**
 * Updates the positions of namespace groups and links on each tick of the simulation.
 * 
 * @param namespaceGroups - The D3 selection of namespace groups.
 * @param link - The D3 selection of links.
 * @param padding - Padding value used to position elements.
 * @param podRadius - Radius of the pods.
 */
export function ticked(
    namespaceGroups: NamespaceGroupSelection,
    link: LinkSelection,
    padding: number,
    podRadius: number
): void {
    namespaceGroups.attr("transform", d => `translate(${d.x}, ${d.y})`);

    link
        .attr("x1", d => getLinkPosition(d, true, namespaceGroups.data(), podRadius).x)
        .attr("y1", d => getLinkPosition(d, true, namespaceGroups.data(), podRadius).y)
        .attr("x2", d => getLinkPosition(d, false, namespaceGroups.data(), podRadius).x)
        .attr("y2", d => getLinkPosition(d, false, namespaceGroups.data(), podRadius).y);
}

/**
 * Calculates the position of a link's endpoint based on the pod position and namespace.
 * 
 * @param d - The policy relationship data.
 * @param isSource - Whether the position is for the source pod.
 * @param namespaces - The array of namespaces.
 * @param podRadius - Radius of the pods.
 * @returns The x and y coordinates of the link endpoint.
 */
export function getLinkPosition(
    d: PolicyRelationship,
    isSource: boolean,
    namespaces: Namespace[],
    podRadius: number = 20
): { x: number, y: number } {
    const namespace = namespaces.find(ns => ns.name === (isSource ? d.namespace : d.relatedNamespace));
    const podName = isSource ? d.podName : d.relatedPod;

    if (!namespace) return { x: 0, y: 0 };

    const podIndex = Array.from(namespace.pods).indexOf(podName);
    const podPosition = podIndex !== -1 ? calculatePodPosition(namespace, podIndex, namespace.size, podRadius, 20) : null;

    if (podPosition) {
        const podWorldPosition = { x: namespace.x! + podPosition.x, y: namespace.y! + podPosition.y };
        const otherNamespace = namespaces.find(ns => ns.name === (isSource ? d.relatedNamespace : d.namespace));
        const otherPosition = otherNamespace
            ? { x: otherNamespace.x!, y: otherNamespace.y! }
            : { x: 0, y: 0 };

        const direction = getDirection(podWorldPosition, otherPosition);

        return {
            x: podWorldPosition.x + direction.x * podRadius,
            y: podWorldPosition.y + direction.y * podRadius,
        };
    }

    const nsCenter = { x: namespace.x!, y: namespace.y! };
    const otherNamespace = namespaces.find(ns => ns.name === (isSource ? d.relatedNamespace : d.namespace));
    const direction = otherNamespace ? getDirection(nsCenter, { x: otherNamespace.x!, y: otherNamespace.y! }) : { x: 0, y: 0 };

    return {
        x: namespace.x! + direction.x * namespace.size / 2,
        y: namespace.y! + direction.y * namespace.size / 2,
    };
}

/**
 * Calculates the position of a pod within a namespace based on its index.
 * 
 * @param namespace - The namespace containing the pod.
 * @param podIndex - The index of the pod within the namespace.
 * @param namespaceSize - The size of the namespace.
 * @param podRadius - The radius of the pod.
 * @param padding - The padding between pods.
 * @returns The x and y coordinates of the pod.
 */
export function calculatePodPosition(
    namespace: Namespace,
    podIndex: number,
    namespaceSize: number,
    podRadius: number,
    padding: number
): { x: number, y: number } {
    const angle = (podIndex / namespace.pods.size) * 2 * Math.PI;
    const x = Math.cos(angle) * (namespaceSize / 2 - podRadius - padding);
    const y = Math.sin(angle) * (namespaceSize / 2 - podRadius - padding);
    return { x, y };
}

/**
 * Determines the direction vector from a start point to an end point.
 * 
 * @param start - The starting coordinates.
 * @param end - The ending coordinates.
 * @returns The direction vector with x and y components.
 */
export function getDirection(
    start: { x: number, y: number },
    end: { x: number, y: number }
): { x: number, y: number } {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance === 0 ? { x: 0, y: 0 } : { x: dx / distance, y: dy / distance };
}

/**
 * Processes the relationships and organizes them into namespaces with their respective pods.
 * 
 * @param relationships - An array of policy relationships.
 * @returns A record of namespaces mapped to their corresponding pods.
 */
export function processRelationships(
    relationships: PolicyRelationship[]
): Record<string, Namespace> {
    const nodes: Record<string, Namespace> = {};

    relationships.forEach((rel) => {
        if (!nodes[rel.namespace]) {
            nodes[rel.namespace] = {
                type: 'namespace',
                name: rel.namespace,
                pods: new Set(),
                size: 0,
            };
        }

        if (!nodes[rel.relatedNamespace]) {
            nodes[rel.relatedNamespace] = {
                type: 'namespace',
                name: rel.relatedNamespace,
                pods: new Set(),
                size: 0,
            };
        }

        if (rel.podName) {
            nodes[rel.namespace].pods.add(rel.podName);
        }

        if (rel.relatedPod) {
            nodes[rel.relatedNamespace].pods.add(rel.relatedPod);
        }
    });

    return nodes;
}

/**
 * Highlights the links associated with a specific namespace or pod.
 * 
 * @param namespaceName - The name of the namespace to highlight.
 * @param podName - The name of the pod to highlight (optional).
 * @param link - The D3 selection of links to modify.
 */
export function highlightLinks(
    namespaceName: string,
    podName: string | null,
    link: LinkSelection
): void {
    resetLinks(link);

    const highlightedColor = "#ff0000";
    link.attr("stroke", (d) => {
        if (podName === null) {
            return d.namespace === namespaceName || d.relatedNamespace === namespaceName
                ? highlightedColor
                : "#69b3a2";
        } else {
            return (d.namespace === namespaceName && d.podName === podName) ||
                (d.relatedNamespace === namespaceName && d.relatedPod === podName)
                ? highlightedColor
                : "#69b3a2";
        }
    }).attr("stroke-width", (d) => {
        if (podName === null) {
            return d.namespace === namespaceName || d.relatedNamespace === namespaceName
                ? 4
                : 2;
        } else {
            return (d.namespace === namespaceName && d.podName === podName) ||
                (d.relatedNamespace === namespaceName && d.relatedPod === podName)
                ? 4
                : 2;
        }
    });

    link.attr("marker-end", (d) => {
        if (podName === null) {
            return d.namespace === namespaceName || d.relatedNamespace === namespaceName
                ? "url(#arrow-highlighted)"
                : "url(#arrow)";
        } else {
            return (d.namespace === namespaceName && d.podName === podName) ||
                (d.relatedNamespace === namespaceName && d.relatedPod === podName)
                ? "url(#arrow-highlighted)"
                : "url(#arrow)";
        }
    });
}

/**
 * Resets all links to their default appearance.
 * 
 * @param link - The D3 selection of links to reset.
 */
export function resetLinks(link: LinkSelection): void {
    link.attr("stroke", "#69b3a2")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrow)");
}
