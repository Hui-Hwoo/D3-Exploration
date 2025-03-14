import "./App.css";
import {
    Axis,
    LinePlot,
    DisjointForceDirectedGraph,
    ForceGraph,
} from "./components";

const controller = {
    Axis: false,
    LinePlot: false,
    DisjointForceDirectedGraph: false,
    ForceGraph: true,
};

function App() {
    return (
        <div className="flex flex-col items-center space-y-4">
            {controller.Axis && <Axis />}
            {controller.LinePlot && <LinePlot />}
            {controller.DisjointForceDirectedGraph && (
                <DisjointForceDirectedGraph />
            )}
            {controller.ForceGraph && <ForceGraph />}
        </div>
    );
}

export default App;
