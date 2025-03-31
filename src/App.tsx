import "./App.css";
import {
    Axis,
    LinePlot,
    DisjointForceDirectedGraph,
    ForceGraph,
    CollisionDetectionGraph,
    ForceDirectedLattice,
} from "./components";

const controller = {
    Axis: false,
    LinePlot: false,
    DisjointForceDirectedGraph: true,
    ForceGraph: true,
    CollisionDetectionGraph: true,
    ForceDirectedLattice: true,
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
            {controller.CollisionDetectionGraph && <CollisionDetectionGraph />}
            {controller.ForceDirectedLattice && <ForceDirectedLattice />}
        </div>
    );
}

export default App;
