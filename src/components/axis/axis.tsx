import { useRef, useEffect } from "react";
import * as d3 from "d3";

export const Axis = () => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (ref.current) {
            // Declare the chart dimensions and margins.
            const width = 640;
            const height = 400;
            const marginTop = 20;
            const marginRight = 20;
            const marginBottom = 30;
            const marginLeft = 40;

            // Declare the x (horizontal position) scale.
            const x = d3
                .scaleUtc()
                .domain([new Date("2023-01-01"), new Date("2024-01-01")])
                .range([marginLeft, width - marginRight]);

            // Declare the y (vertical position) scale.
            const y = d3
                .scaleLinear()
                .domain([0, 100])
                .range([height - marginBottom, marginTop]);

            // Create the SVG container.
            const svg = d3.select(ref.current);
            svg.selectAll("*").remove();
            svg.attr("width", width).attr("height", height);

            // Add the x-axis.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x));

            // Alternatively, you can use the following code to rotate the x-axis labels:
            // const newG = svg
            //     .append("g")
            //     .attr("transform", `translate(0,${height - marginBottom})`);
            // const axisBottomGenerator = d3.axisBottom(x);
            // axisBottomGenerator(newG);

            // Add the y-axis.
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y));
        }
    });

    return (
        <div className="border-2 border-primary rounded-2xl">
            <svg ref={ref}></svg>
        </div>
    );
};
