// To use this module, create a simulation for an array of nodes and apply the desired forces.
// Then listen for tick events to render the nodes as they update in your preferred graphics system, such as Canvas or SVG.

import { useRef, useEffect } from "react";
import * as d3 from "d3";
import data from "./data.json";

type DFDNode = d3.SimulationNodeDatum & {
    id: string;
    group: string;
    radius?: number;
    citing_patents_count?: number;
};

export const DisjointForceDirectedGraph = () => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (ref.current) {
            // Specify the dimensions of the chart.
            const width = 928;
            const height = 680;

            // Specify the color scale.
            const color = d3.scaleOrdinal(["#ffffff", "#ffffff00"]);

            // The force simulation mutates links and nodes, so create a copy
            // so that re-evaluating this cell produces the same result.
            const links = data.DFD.links.map((d) => ({ ...d }));
            const nodes = data.DFD.nodes.map((d) => ({
                ...d,
            })) as DFDNode[];

            // Create a simulation with several forces.
            const simulation = d3
                .forceSimulation(nodes)
                .force(
                    "link",
                    d3.forceLink(links).id((d) => (d as DFDNode).id)
                )
                .force("charge", d3.forceManyBody())
                .force("x", d3.forceX())
                .force("y", d3.forceY());

            // Create the SVG container.
            const svg = d3.select(ref.current);
            svg.selectAll("*").remove();

            svg.attr("width", width)
                .attr("height", height)
                .attr("viewBox", [-width / 2, -height / 2, width, height])
                .attr("style", "max-width: 100%; height: auto;");

            // Add a line for each link, and a circle for each node.
            const link = svg
                .append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .selectAll("line")
                .data(links)
                .join("line")
                .attr("stroke-width", (d) => Math.sqrt(d.value));

            const node = svg
                .append("g")
                .attr("stroke", "currentColor")
                .attr("stroke-width", 1.5)
                .selectAll("circle")
                .data(nodes)
                .join("circle")
                .attr("r", 5)
                .attr("fill", (d) => color(d.group));

            node.append("title").text((d) => d.id);

            // Reheat the simulation when drag starts, and fix the subject position.
            function dragStarted(
                event: d3.D3DragEvent<SVGCircleElement, DFDNode, DFDNode>
            ) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            // Update the subject (dragged node) position during drag.
            function dragged(
                event: d3.D3DragEvent<SVGCircleElement, DFDNode, DFDNode>
            ) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            // Restore the target alpha so the simulation cools after dragging ends.
            // Unfix the subject position now that it’s no longer being dragged.
            function dragEnded(
                event: d3.D3DragEvent<SVGCircleElement, DFDNode, DFDNode>
            ) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            // Add a drag behavior.
            node.call(
                d3
                    .drag<SVGCircleElement, DFDNode>()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded) as (
                    selection: d3.Selection<
                        SVGCircleElement | d3.BaseType,
                        DFDNode,
                        SVGGElement,
                        unknown
                    >
                ) => void
            );

            // Set the position attributes of links and nodes each time the simulation ticks.
            simulation.on("tick", () => {
                link.attr(
                    "x1",
                    (d) => (d.source as unknown as DFDNode).x as number
                )
                    .attr(
                        "y1",
                        (d) => (d.source as unknown as DFDNode).y as number
                    )
                    .attr(
                        "x2",
                        (d) => (d.target as unknown as DFDNode).x as number
                    )
                    .attr(
                        "y2",
                        (d) => (d.target as unknown as DFDNode).y as number
                    );

                node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
            });
        }
    }, []);

    return (
        <div className="border-2 border-primary rounded-2xl">
            <svg ref={ref}></svg>
        </div>
    );
};
