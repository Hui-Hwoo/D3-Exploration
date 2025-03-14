import * as d3 from "d3";
import { useRef, useEffect } from "react";

interface LinePlotProps {
    data?: number[];
    width?: number;
    height?: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
}

export function LinePlot({
    data = [2, 12, 6, 4, 8, 9, 10, 3, 4],
    width = 640,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 30,
    marginLeft = 40,
}: LinePlotProps) {
    const gx = useRef<SVGGElement>(null);
    const gy = useRef<SVGGElement>(null);
    const x = d3.scaleLinear(
        [0, data.length - 1],
        [marginLeft, width - marginRight]
    );
    const extent = d3.extent(data) as [number, number];
    const y = d3.scaleLinear(extent, [height - marginBottom, marginTop]);
    const line = d3.line<number>((_d, i) => x(i), y);

    useEffect(() => {
        if (gx.current) {
            d3.select(gx.current).call(d3.axisBottom(x));
        }
    }, [gx, x]);
    useEffect(() => {
        if (gy.current) {
            d3.select(gy.current).call(d3.axisLeft(y));
        }
    }, [gy, y]);

    // const line = d3
    //     .line<number>()
    //     .x((_d, i) => x(i))
    //     .y((d) => y(d));

    // d3.line(xAccessor, yAccessor);
    // xAccessor(d, i) or xAccessor(d): Function that returns the x-coordinate for each data point.
    // yAccessor(d, i): Function that returns the y-coordinate for each data point.

    return (
        <div className="border-2 border-primary rounded-2xl">
            <svg width={width} height={height}>
                <g
                    ref={gx}
                    transform={`translate(0,${height - marginBottom})`}
                />
                <g ref={gy} transform={`translate(${marginLeft},0)`} />
                <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    d={line(data) || ""}
                />
                <g fill="white" stroke="currentColor" strokeWidth="1.5">
                    {data.map((d, i) => (
                        <circle key={i} cx={x(i)} cy={y(d)} r="2.5" />
                    ))}
                </g>
            </svg>
        </div>
    );
}
