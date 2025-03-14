import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import data from "./data.json";

// ===================================== //
// Link: https://observablehq.com/@ben-tanen/a-tutorial-to-using-d3-force-from-someone-who-just-learned-ho
// ===================================== //

/*
  Structure of d3-force simulations 

  1. create a copy of the node data
  2. create new force simulation specifying the forces to use 
    sim = d3.forceSimulation(nodes)
      .force("force_name", ...)
      // ... chain together as many forces as we want
      .stop()
      .tick(n_frames_to_simulate)
  3. bind data and draw nodes
    node = svg.selectAll(".node")
      .data(nodes).enter()
      // ... specify node position
  4. indicate how we should update the graph for each tick
    sim.on("tick", () => {
      // ... specify how we should move nodes/edges given new positional data
 */

// ===================================== //
//                  Type                 //
// ===================================== //

type Node = {
    x: number;
    y: number;
    r: number;
};

type SVGNode = d3.SimulationNodeDatum & {
    r: number;
};

type Edge = {
    source: number | SVGNode;
    target: number | SVGNode;
};

// ===================================== //
//           Shared Config               //
// ===================================== //

const node_data = data.node as Node[];
const edge_data = data.edge as Edge[];

const chartParam = {
    width: 1152,
    height: 500,
    margin: { top: 10, right: 10, bottom: 10, left: 10, center: 150 },
};

const x = d3
    .scaleLinear()
    .domain([0, 1])
    .range([
        chartParam.margin.left,
        chartParam.width - chartParam.margin.right,
    ]);

const y = d3
    .scaleLinear()
    .domain([0, 1])
    .range([
        chartParam.height - chartParam.margin.bottom,
        chartParam.margin.top,
    ]);
const r = d3
    .scaleLinear()
    .domain([0, 1])
    .range([
        chartParam.margin.center,
        Math.min(
            chartParam.width / 2 -
                Math.max(chartParam.margin.left, chartParam.margin.right),
            chartParam.height / 2 -
                Math.max(chartParam.margin.top, chartParam.margin.bottom)
        ),
    ]);

const distance = ([x1, y1]: [number, number], [x2, y2]: [number, number]) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

const Button = ({ text, onClick }: { text: string; onClick: () => void }) => (
    <div className="flex flex-row items-center justify-center">
        <button
            className="btn btn-primary border-2 rounded-lg px-4 py-2 hover:bg-white/30 h-fit"
            onClick={onClick}
        >
            <div className="text-sm font-mono">{text}</div>
        </button>
    </div>
);

// range selector
const RangeSelector = ({
    title,
    value,
    setValue,
    min,
    max,
    step,
}: {
    title: string;
    value: number;
    setValue: (value: number) => void;
    min: number;
    max: number;
    step: number;
}) => (
    <div className="flex flex-row items-center justify-center">
        <div className="text-center text-xl font-sm font-semibold p-5 font-mono">{`${title}: ${value
            .toString()
            .padStart(3, "0")}`}</div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => setValue(parseFloat(e.target.value))}
        />
    </div>
);

// Drop down selector
const DropDownSelector = ({
    title,
    value,
    setValue,
    options,
}: {
    title: string;
    value: number;
    setValue: (value: string) => void;
    options: {
        value: number;
        label: string;
    }[];
}) => (
    <div className="flex flex-row items-center justify-center">
        <div className="text-center text-xl font-sm font-mono font-semibold p-5">{`${title}`}</div>
        <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="p-2 rounded-lg border-2 border-primary mr-4 font-mono font-sm"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const drawNodes = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    node_data: Node[],
    edge_data: Edge[] | null,
    showRadius: boolean,
    showEdge: boolean
) => {
    let edge = null;
    if (edge_data) {
        edge = svg
            .selectAll(".edge")
            .data(edge_data)
            .enter()
            .append("line")
            .classed("edge", true)
            .attr("x1", (d: Edge) => {
                if (typeof d.source === "number") {
                    return node_data[d.source as number].x;
                } else {
                    return (d.source as Node).x;
                }
            })
            .attr("y1", (d: Edge) => {
                if (typeof d.source === "number") {
                    return node_data[d.source as number].y;
                } else {
                    return (d.source as Node).y;
                }
            })
            .attr("x2", (d: Edge) => {
                if (typeof d.target === "number") {
                    return node_data[d.target as number].x;
                } else {
                    return (d.target as Node).x;
                }
            })
            .attr("y2", (d: Edge) => {
                if (typeof d.target === "number") {
                    return node_data[d.target as number].y;
                } else {
                    return (d.target as Node).y;
                }
            })
            .style("stroke", showEdge ? "currentColor" : "none")
            .style("opacity", showEdge ? 0.5 : 0);
    }

    const node = svg
        .selectAll(".node")
        .data(node_data)
        .enter()
        .append("circle")
        .classed("node", true)
        .attr("cx", (d: Node) => d.x)
        .attr("cy", (d: Node) => d.y)
        .attr("r", (d: Node) => (showRadius ? d.r : 8))
        .style("fill", "currentColor");

    return [node, edge];
};

// ===================================== //
//          Node Distribution            //
// ===================================== //

const NodeDistribution = () => {
    const ref = useRef<SVGSVGElement>(null);
    const [showRadius, setShowRadius] = useState(true);
    const [showEdge, setShowEdge] = useState(true);
    const nodes = node_data.map((d) => ({ ...d }));
    const edges = edge_data.map((d) => ({ ...d }));

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        // draw nodes (with radius and edges based on user input)
        drawNodes(svg, nodes, edges, showRadius, showEdge);
    }, [showEdge, showRadius]);

    return (
        <div className="border-2 border-primary rounded-2xl mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Node Distribution
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-end space-x-4 mb-5 mr-5">
                <Button
                    text={showRadius ? "Hide Radius" : "Show Radius"}
                    onClick={() => setShowRadius(!showRadius)}
                />
                <Button
                    text={showEdge ? "Hide Edge" : "Show Edge"}
                    onClick={() => setShowEdge(!showEdge)}
                />
            </div>
        </div>
    );
};

// ===================================== //
//            X-Y Force Graph            //
// ===================================== //

const XYForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(1);
    const [strength, setStrength] = useState(0.15);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        // create simulation using x + y forces towards center with strength
        const sim = d3
            .forceSimulation(nodes)
            .force("x", d3.forceX(x(0.5)).strength(strength))
            .force("y", d3.forceY(y(0.5)).strength(strength))
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x).attr("cy", (d: Node) => d.y);
            }
        }).stop();

        // run the simulation for kf frames
        sim.on("end", () => {
            console.log("simulation ended");
        });
    }, [frameNum, strength, nodes]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Positional X and Y Forces
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-5">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={1}
                    max={10}
                    step={1}
                />
                <RangeSelector
                    title="Strength of forces"
                    value={strength}
                    setValue={setStrength}
                    min={0.05}
                    max={0.25}
                    step={0.01}
                />
            </div>
        </div>
    );
};

// ===================================== //
//         Collide Force Graph           //
// ===================================== //

/*
    Telling our nodes where to go is great and all, but when simply using positional x and y forces, 
    our nodes do not at all interact with one another and ultimately all overlap at our specified position. 
    If we instead want our nodes to interact and collide off one another, we can use forceCollide().

    In this simulation, there are three competing forces applied to each node and as the simulation runs along, 
    these forces will balance out against each other until our nodes reach a stable point of equilibrium. 
    Depending on how many competing forces we have, it may take more or less time to each this equilibrium.

    What about if our nodes are not all the same size? 
    It's actually quite simple to apply different collision radii (or any other force parameter) based on our node data.
*/

const CollideForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(200);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        const sim = d3
            .forceSimulation<SVGNode>(nodes)
            .force("x", d3.forceX(x(0.5)).strength(0.175))
            .force("y", d3.forceY(y(0.5)).strength(0.175))
            .force(
                "collide",
                d3.forceCollide().radius((d: any) => d.r + 1)
            )
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Collide Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-5">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={0}
                    max={300}
                    step={30}
                />
            </div>
        </div>
    );
};

// ===================================== //
//        Many Body Force Graph          //
// ===================================== //

/*
    Beyond interacting via collisions, we can also have our nodes interact with one another using a many-body force. 
    This means the force in question is applied on each combination of nodes (many-to-many). 
    Depending on the strength used, we can use forceManyBody() to simulate node attraction (similar to similarly charged particles) 
    or node repulsion (similar to oppositely charged particles).
 */

const ManyBodyForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(75);
    const [strength, setStrength] = useState(0.15);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        const sim = d3
            .forceSimulation<SVGNode>(nodes)
            .force("charge", d3.forceManyBody().strength(strength))
            .force(
                "collide",
                d3.forceCollide().radius((d: any) => d.r + 1)
            )
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Many Body Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-2">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={0}
                    max={150}
                    step={10}
                />
                <DropDownSelector
                    title="Strength of forces"
                    value={strength}
                    setValue={(value) => setStrength(parseFloat(value))}
                    options={[
                        {
                            label: "Strong attraction (5)",
                            value: 5,
                        },
                        {
                            label: "Weak attraction (2)",
                            value: 2,
                        },
                        {
                            label: "Weak repulsion (-2)",
                            value: -2,
                        },
                        {
                            label: "Strong repulsion (-5)",
                            value: -5,
                        },
                    ]}
                />
            </div>
        </div>
    );
};

// ===================================== //
//           Link Force Graph            //
// ===================================== //

/*
    Using forceLink(), we can then provide an attraction force between connected nodes such that 
    our graph arranges itself according to our edges. Unlike the previously discussed forces that take singular arguments to define the force, 
    forceLink() takes a list of data to define the edges we want to include and use for force. This data should look like:

    edge_data = [
    {source: 0, target: 5}, // connect the 1st node in our node_data list to the 6th node
    {source: 2, target: 4}, // connect the 3rd node in our node_date list to the 5th node
    ...
    ]

    We can then pass this list of edges to forceLink() and voilà, we have a connected force-directed graph! 
    Quick note: like with our node data, we will want to make a copy of our original edge data before passing it to forceLink() 
    because the force simulation will modify the data as the simulation runs.

    edges = edge_data.map(d => Object.create(d))
    sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(edges))
        .force("charge", d3.forceManyBody().strength(-8))
        .force("collide", d3.forceCollide().radius(9))

    If we just apply a link force, our connected nodes will be attracted towards each other, 
    but there will be no forces repelling non-connected nodes. To remedy this, we can add either many-body or collide forces.

    In addition to strength, link distance is an important parameter that will dictate 
    how closely clustered our graph will end up. Play around with the link distance parameter below to see its effect on the simulation.

    Another quick note: while we will typically want to draw the edges on our graph to show how nodes are connected, 
    it is certainly not necessary. If the situation calls for it, you can totally apply a "hidden" link force.
 */

const LinkForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const edges: Edge[] = edge_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(75);
    const [linkDistance, setLinkDistance] = useState(7);
    const [showEdge, setShowEdge] = useState(true);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        const sim = d3
            .forceSimulation<SVGNode>(nodes)
            .force("link", d3.forceLink(edges).distance(linkDistance))
            .force(
                "collide",
                d3.forceCollide().radius((d: any) => d.r + 1)
            )
            .force("charge", d3.forceManyBody().strength(-8))
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node, _edge] = drawNodes(svg, nodes, edges, true, showEdge) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            d3.Selection<SVGLineElement, Edge, SVGSVGElement, unknown>
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum, showEdge]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Many Body Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-2">
                <Button
                    text={showEdge ? "Hide Edge" : "Show Edge"}
                    onClick={() => setShowEdge(!showEdge)}
                />
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={0}
                    max={150}
                    step={10}
                />
                <RangeSelector
                    title="Link distance"
                    value={linkDistance}
                    setValue={setLinkDistance}
                    min={0}
                    max={100}
                    step={5}
                />
            </div>
        </div>
    );
};

// ===================================== //
//          Radial Force Graph           //
// ===================================== //

/*
    Another positional force within d3-force is the radial force, 
    which pushes nodes towards a set radius around a central point. 
    To use it, all we need to do is pass our desired radius r. 
    We can also define the central point to our radial force (as an x and y dimension), though it is optional. 
    If not specified, the center point defaults to [0, 0].

    When applying this radial force, nodes are free to be at any point along this radius, 
    which allows for some circular movement (if the other forces dictate it).

    sim = d3.forceSimulation(nodes)
        .force("radial", d3.forceRadial(240, w / 2, h / 2))
        .force("collide", d3.forceCollide().radius(9))
 */
const RadialForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(10);
    const [radius, setRadius] = useState(150);

    const [mode, setMode] = useState(false); // set the radius based on the size of the node(true)

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        // draw radial guide circle
        if (mode) {
            // draw guide circles
            svg.selectAll(".guide-circle")
                .data([0, 1])
                .enter()
                .append("circle")
                .attr("cx", x(0.5))
                .attr("cy", y(0.5))
                .attr("r", (d) => r(d))
                .style("fill", "none")
                .style("stroke", "currentColor")
                .style("stroke-width", 2)
                .style("stroke-dasharray", 4);
        } else {
            svg.append("circle")
                .attr("cx", x(0.5))
                .attr("cy", y(0.5))
                .attr("r", radius)
                .style("fill", "none")
                .style("stroke", "currentColor")
                .style("stroke-width", 2)
                .style("stroke-dasharray", 4);
        }

        let sim;
        if (mode) {
            sim = d3
                .forceSimulation<SVGNode>(nodes)
                .force(
                    "collide",
                    d3.forceCollide().radius((d: any) => d.r + 1)
                )
                .force("radial", d3.forceRadial(radius, x(0.5), y(0.5)))
                .force(
                    "radial",
                    d3
                        .forceRadial(
                            (d) =>
                                r(
                                    (d as Node).r /
                                        (d3.max(nodes as Node[], (d) => d.r) ||
                                            1)
                                ),
                            x(0.5),
                            y(0.5)
                        )
                        .strength(0.25)
                )
                .tick(frameNum);
        } else {
            sim = d3
                .forceSimulation<SVGNode>(nodes)
                .force(
                    "collide",
                    d3.forceCollide().radius((d: any) => d.r + 1)
                )
                .force("radial", d3.forceRadial(radius, x(0.5), y(0.5)))
                .tick(frameNum);
        }

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Radial Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-2">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={0}
                    max={mode ? 100 : 25}
                    step={1}
                />
                <RangeSelector
                    title="Radius"
                    value={radius}
                    setValue={setRadius}
                    min={50}
                    max={250}
                    step={10}
                />
                <Button
                    text={mode ? "Uniform Radius" : "Radius based on node size"}
                    onClick={() => setMode(!mode)}
                />
            </div>
        </div>
    );
};

// ===================================== //
//          Center Force Graph          //
// ===================================== //

/*
    Based on its name, the center force seems like it would perform something similar to how we used the x and y force above. 
    However, instead of actually forcing our nodes towards a particular point in space, 
    forceCenter() moves the positioning of the force system. In this way, forceCenter is a helpful tool for 
    adjusting the placement of our graph without having to adjust any of our other forces.

    // force each node towards the center of our graph, which is actually at [576.00, 274.00]
    // with collisions occurring at each node's radius (plus some padding)
    
    sim = d3.forceSimulation(nodes)
        .force("x", d3.forceX(w / 2))
        .force("y", d3.forceY(h / 2))
        .force("collide", d3.forceCollide(9))
        .force("center", d3.forceCenter(576.00, 274.00)); // offset the center of our system
 */

const CenterForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(12);
    const [cx, setCx] = useState(0.5);
    const [cy, setCy] = useState(0.5);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        svg.append("circle")
            .attr("cx", x(cx))
            .attr("cy", y(cy))
            .attr("r", 104)
            .style("fill", "none")
            .style("stroke", "currentColor")
            .style("stroke-width", 2)
            .style("stroke-dasharray", 4);

        const sim = d3
            .forceSimulation<SVGNode>(nodes)
            .force("x", d3.forceX(x(0.5)).strength(0.03))
            .force("y", d3.forceY(y(0.5)).strength(0.03))
            .force(
                "collide",
                d3.forceCollide().radius((d: any) => d.r + 1)
            )
            .force("center", d3.forceCenter().x(x(cx)).y(y(cy)))
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Center Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-2">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={0}
                    max={45}
                    step={1}
                />
                <RangeSelector
                    title="Center X"
                    value={cx}
                    setValue={setCx}
                    min={0.2}
                    max={0.8}
                    step={0.1}
                />
                <RangeSelector
                    title="Center Y"
                    value={cy}
                    setValue={setCy}
                    min={0.1}
                    max={0.8}
                    step={0.1}
                />
            </div>
        </div>
    );
};

// ===================================== //
//           Custom Force Graph          //
// ===================================== //

/*
    But what if you want to do something else not achievable with these? 
    Well, it's actually pretty simple to write a custom force function for whatever behavior you might want.
     All we need to do is specify how we should change each node's position and velocity based on the current situation.

    An example custom force that you might want to use is a bounding force that limits where our nodes can travel 
    (to keep them in frame, etc.). To do this, we can simply write a function that checks if a node is outside our bounded area 
    and then update the node's position to be inside the area if needed.

    sim = d3.forceSimulation(nodes)
        // ... other standard forces
        .force("bounding-circle", () => {
            nodes.forEach(node => {
            if (isOutside(node)) {
                node.x = ... // new x position
                node.y = ... // new y position
            }
            })
        })
 */

const CustomForceGraph = () => {
    const ref = useRef<SVGSVGElement>(null);
    const nodes: Node[] = node_data.map((d) => ({ ...d }));
    const [frameNum, setFrameNum] = useState(12);
    const [radius, setRadius] = useState(150);

    useEffect(() => {
        if (!ref.current) return;
        const svg = d3.select<SVGSVGElement, unknown>(ref.current);
        svg.selectAll("*").remove();
        svg.attr("width", chartParam.width).attr("height", chartParam.height);

        // draw bounding circle
        svg.append("circle")
            .attr("cx", x(0.5))
            .attr("cy", y(0.5))
            .attr("r", radius)
            .style("fill", "none")
            .style("stroke", "#bbb");

        // create simulation using:
        // (1) collide force
        // (2) many-body charge force, based on the node's size
        // (3) a custom force bounding the nodes inside the bounding circle
        const sim = d3
            .forceSimulation<SVGNode>(nodes)
            .force(
                "collide",
                d3.forceCollide().radius((d) => (d as Node).r + 1)
            )
            .force(
                "charge",
                d3.forceManyBody().strength((d) => -(d as Node).r / 2)
            )
            .force("bounding-circle", () => {
                nodes.forEach((node) => {
                    // if node is outside of the bounding circle,
                    // move node just inside circle along same polar axis
                    if (distance([node.x, node.y], [x(0.5), y(0.5)]) > radius) {
                        const theta = Math.atan(
                            (node.y - y(0.5)) / (node.x - x(0.5))
                        );
                        node.x =
                            x(0.5) +
                            radius *
                                Math.cos(theta) *
                                (node.x < x(0.5) ? -1 : 1);
                        node.y =
                            y(0.5) +
                            radius *
                                Math.sin(theta) *
                                (node.x < x(0.5) ? -1 : 1);
                    }
                });
            })
            .tick(frameNum);

        // draw nodes (with uniform radius and no edges)
        const [node] = drawNodes(svg, nodes, null, true, false) as [
            d3.Selection<SVGCircleElement, Node, SVGSVGElement, unknown>,
            null
        ];

        // update each node upon simulation tick
        sim.on("tick", () => {
            if (node) {
                node.attr("cx", (d: Node) => d.x)
                    .attr("cy", (d: Node) => d.y)
                    .attr("r", (d: Node) => d.r);
            }
        }).stop();
    }, [nodes, frameNum]);

    return (
        <div className="border-2 border-primary rounded-2xl p-3 mb-8">
            <div className="text-center text-2xl font-mono font-semibold p-5">
                Custom Force Graph
            </div>
            <svg ref={ref}></svg>
            <div className="flex justify-center space-x-4 mb-5 mr-2">
                <RangeSelector
                    title="Frame of simulation"
                    value={frameNum}
                    setValue={setFrameNum}
                    min={1}
                    max={25}
                    step={1}
                />
                <RangeSelector
                    title="Radius"
                    value={radius}
                    setValue={setRadius}
                    min={100}
                    max={200}
                    step={10}
                />
            </div>
        </div>
    );
};

// ===================================== //
//           Force Graph Wrapper         //
// ===================================== //

export const ForceGraph = () => {
    return (
        <div>
            <NodeDistribution />
            <XYForceGraph />
            <CollideForceGraph />
            <ManyBodyForceGraph />
            <LinkForceGraph />
            <RadialForceGraph />
            <CenterForceGraph />
            <CustomForceGraph />
        </div>
    );
};
