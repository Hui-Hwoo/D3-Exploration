import { useEffect, useRef } from "react";
import * as d3 from "d3";

const getData = () => {
    const n = 15;
    const nodes = Array.from({ length: n * n }, (_, i) => ({
        index: i,
        x: Math.floor(i / n) - (i % n) / n + Math.random(),
        y: i % n,
    }));
    const links = [];
    for (let y = 0; y < n; ++y) {
        for (let x = 0; x < n; ++x) {
            if (y > 0)
                links.push({ source: (y - 1) * n + x, target: y * n + x });
            if (x > 0)
                links.push({ source: y * n + (x - 1), target: y * n + x });
        }
    }
    return { nodes, links };
};

export const ForceDirectedLattice = () => {
    const ref = useRef(null);
    const width = 600;
    const height = 600;
    const data = getData();

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", width)
            .attr("height", height)
            .attr("overflow", "visible");

        const links = data.links.map((d) => ({ ...d }));
        const nodes = data.nodes.map((d) => ({ ...d }));

        const simulation = d3
            .forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-30))
            .force(
                "link",
                d3.forceLink(links).strength(2).distance(20).iterations(10)
            )
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        const drag = d3
            .drag<
                SVGCircleElement,
                {
                    index: number;
                    x: number;
                    y: number;
                    fx?: number | null;
                    fy?: number | null;
                }
            >()
            .subject((event) => {
                const node = simulation.find(event.x, event.y);
                return node ? node : { x: event.x, y: event.y };
            })
            .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });

        const link = svg
            .selectAll("line")
            .data(links)
            .enter()
            .append("line")
            .attr("stroke", "currentColor")
            .attr("stroke-width", 2)
            .attr("opacity", 0.4);

        const node = svg
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 6.5)
            .attr("fill", "currentColor")
            .call(drag);

        function ticked() {
            link.attr("x1", (d) => (d.source as any).x)
                .attr("y1", (d) => (d.source as any).y)
                .attr("x2", (d) => (d.target as any).x)
                .attr("y2", (d) => (d.target as any).y);

            node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        }
    }, []);

    return (
        <div className="p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Force Directed Lattice
            </div>
            <svg ref={ref}></svg>
        </div>
    );
};
