<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import * as d3 from "d3";
    import type { Policy, PolicyRelationship } from "../types";
    import {
        processRelationships,
        ticked,
        getLinkPosition,
        calculatePodPosition,
        highlightLinks,
        resetLinks,
    } from "../utils/visualization/graph";

    export let relationships: PolicyRelationship[];

    console.log("relationships", relationships);

    let svg: SVGSVGElement;

    const createVisualization = () => {
        const width = 1100;
        const height = 600;
        const podRadius = 20;
        const padding = 20;
        const podLabelLength = 12;

        const namespaces = Object.values(processRelationships(relationships));

        // Scaling functions for zoom and collision
        const scaleZoom = (namespaceCount: number) => {
            const minZoom = 0.24;
            const maxZoom = 1;
            const maxNamespaces = 12;
            return Math.max(
                minZoom,
                maxZoom -
                    (namespaceCount / maxNamespaces) * (maxZoom - minZoom),
            );
        };

        const scaleCollision = (namespaceCount: number) => {
            const minCollision = 50;
            const maxCollision = 200;
            const maxNamespaces = 12;
            return Math.min(
                maxCollision,
                minCollision +
                    (namespaceCount / maxNamespaces) *
                        (maxCollision - minCollision),
            );
        };

        const zoomScale = scaleZoom(namespaces.length);
        const collision = scaleCollision(namespaces.length);

        d3.select(svg).selectAll("*").remove();

        const svgSelection = d3
            .select(svg)
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const g = svgSelection.append("g");

        const zoom = d3
            .zoom()
            .scaleExtent([zoomScale, 5])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svgSelection
            .call(zoom)
            .call(
                zoom.transform,
                d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(zoomScale),
            );

        namespaces.forEach((namespace) => {
            const podCount = namespace.pods.size;
            const minSize = 80;
            const sizeMultiplier = 3.5 * podRadius;
            const size = Math.max(
                minSize,
                Math.ceil(Math.sqrt(podCount)) * sizeMultiplier + padding * 2,
            );
            namespace.size = size;
        });

        const namespaceGroups = g
            .selectAll("g.namespace")
            .data(namespaces)
            .enter()
            .append("g")
            .attr("class", "namespace")
            .call(
                d3
                    .drag()
                    .on("start", (event, d) =>
                        dragstarted(event, d, simulation),
                    )
                    .on("drag", dragged)
                    .on("end", (event, d) => dragended(event, d, simulation)),
            )
            .on("mouseover", function (event, d) {
                highlightLinks(d.name, null, link);
            })
            .on("mouseout", function () {
                resetLinks(link);
            });

        namespaceGroups
            .append("rect")
            .attr("width", (d) => d.size)
            .attr("height", (d) => d.size)
            .attr("x", (d) => -d.size / 2)
            .attr("y", (d) => -d.size / 2)
            .attr("fill", "#333")
            .attr("stroke", "#4682b4")
            .attr("stroke-width", 2);

        namespaceGroups
            .append("text")
            .attr("x", 0)
            .attr("y", (d) => -d.size / 2 - 10)
            .attr("text-anchor", "middle")
            .text((d) => "ns: " + d.name)
            .style("font-size", "18px")
            .style("margin", "10px")
            .style("fill", "#fff");

        namespaceGroups.each(function (namespace) {
            const podGroups = d3
                .select(this)
                .selectAll("g.pod")
                .data(Array.from(namespace.pods))
                .enter()
                .append("g")
                .attr("class", "pod")
                .attr("transform", (d, i) => {
                    const { x, y } = calculatePodPosition(
                        namespace,
                        i,
                        namespace.size,
                        podRadius,
                        padding,
                    );
                    return `translate(${x}, ${y})`;
                })
                .on("mouseover", function (event, pod) {
                    resetLinks(link); // Reset any previously highlighted links/arrows
                    highlightLinks(namespace.name, pod, link);
                    event.stopPropagation();
                })
                .on("mouseout", function () {
                    resetLinks(link);
                });

            podGroups
                .append("circle")
                .attr("r", podRadius)
                .attr("fill", "#69b3a2");

            podGroups
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dy", podRadius + 10)
                .text((d) => d.substring(0, podLabelLength))
                .style("font-size", "12px")
                .style("fill", "#fff");
        });

        const link = g
            .append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(relationships)
            .enter()
            .append("line")
            .attr("stroke-width", 2)
            .attr("stroke", "#69b3a2")
            .attr("marker-end", "url(#arrow)");

        svgSelection
            .append("defs")
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#69b3a2");

        svgSelection
            .append("defs")
            .append("marker")
            .attr("id", "arrow-highlighted")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 9)
            .attr("refY", 5)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "#ff0000");

        const simulation = d3
            .forceSimulation(namespaces)
            .force("center", d3.forceCenter(0, 0))
            .force("collide", d3.forceCollide().radius(collision))
            .on("tick", () =>
                ticked(namespaceGroups, link, padding, podRadius),
            );

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    };

    afterUpdate(() => {
        createVisualization();
    });
</script>

<svg bind:this={svg} id="policy-viz"></svg>

<style>
    svg {
        border: 1px solid #ccc;
        min-width: 100%;
    }
</style>
