import { useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "./data.json";

export const CollisionDetectionGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const frameNum = 5;
    const strength = 0.15;
    const width = 600;
    const height = 600;

    const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([0, height]);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", width)
            .attr("height", height)
            .attr("overflow", "visible");

        const color = d3.scaleOrdinal(d3.schemeTableau10);

        // Initialize nodes with random positions
        const nodes = data.CollisionDetection.map((d) => ({
            ...d,
            x: Math.random() * width,
            y: Math.random() * height,
        }));

        const simulation = d3
            .forceSimulation(nodes)
            .alphaTarget(0.3) // stay hot
            .velocityDecay(0.1) // low friction
            .force("x", d3.forceX(x(0.5)).strength(0.01))
            .force("y", d3.forceY(y(0.5)).strength(0.01))
            .force(
                "collide",
                d3
                    .forceCollide()
                    // @ts-ignore
                    .radius((d) => d.r * 0.8 + 1)
                    .iterations(4)
            )
            .force(
                "charge",
                d3
                    .forceManyBody()
                    .strength((_d, i) => (i ? 0 : (-width * 2) / 3))
            )
            .on("tick", ticked);

        const node = svg
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", (d) => d.r * 0.8)
            .attr("fill", (d, idx) =>
                idx === 0 ? "transparent" : color(d.group.toString())
            );

        simulation.on("tick", ticked);

        function ticked() {
            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        }

        function pointerMoved(
            event:
                | d3.D3DragEvent<SVGSVGElement, unknown, unknown>
                | d3.D3ZoomEvent<SVGSVGElement, unknown>
        ) {
            const [x, y] = d3.pointer(event);
            (
                nodes[0] as d3.SimulationNodeDatum & {
                    fx?: number;
                    fy?: number;
                }
            ).fx = x;
            (
                nodes[0] as d3.SimulationNodeDatum & {
                    fx?: number;
                    fy?: number;
                }
            ).fy = y;
            simulation.alphaTarget(0.3).restart();
        }

        svg.on("touchmove", (event) => {
            event.preventDefault();
            pointerMoved(event);
        }).on("pointermove", pointerMoved);

        return () => {
            simulation.stop(); // Cleanup simulation on component unmount
        };
    }, [frameNum, strength]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Collision Detection Graph
            </div>
            <svg ref={ref}></svg>
        </div>
    );
};
