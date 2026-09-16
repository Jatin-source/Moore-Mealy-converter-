class VisualizationEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.simulation = null;
        this.machineData = null;
        this.nodes = [];
        this.links = [];
        
        // Listen to events from other modules
        window.addEventListener('machine-converted', (e) => this.renderMachine(e.detail.converted_machine));
        window.addEventListener('step-changed', (e) => this.highlightStep(e.detail));
        
        // Initial render of whatever is in the input
        setTimeout(() => {
            if (window.machineInput) {
                this.renderMachine(window.machineInput.getMachineJSON());
            }
        }, 500);
    }

    renderMachine(machine) {
        this.machineData = machine;
        const container = d3.select(`#${this.containerId}`);
        container.selectAll("*").remove(); // Clear previous

        const width = container.node().getBoundingClientRect().width;
        const height = container.node().getBoundingClientRect().height;

        this.svg = container.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, width, height]);

        // Define arrow markers
        this.svg.append("defs").selectAll("marker")
            .data(["end", "active-end"])
            .join("marker")
            .attr("id", d => d)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 25)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("fill", d => d === 'active-end' ? '#0ea5e9' : '#475569')
            .attr("d", "M0,-5L10,0L0,5");

        // Parse nodes and links
        this.nodes = machine.states.map(s => ({ 
            id: s, 
            label: machine.type === 'moore' ? `${s}/${machine.outputs[s]}` : s 
        }));
        
        this.links = machine.transitions.map(t => ({
            source: t.from,
            target: t.to,
            label: machine.type === 'mealy' ? `${t.input}/${t.output}` : t.input,
            id: `${t.from}-${t.input}-${t.to}`
        }));

        // Force Simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-800))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(50));

        // Draw Links
        const link = this.svg.append("g")
            .attr("class", "links")
            .selectAll("path")
            .data(this.links)
            .join("path")
            .attr("class", "link")
            .attr("id", d => `link-${d.id}`)
            .attr("marker-end", "url(#end)");

        // Draw Link Labels
        const linkLabels = this.svg.append("g")
            .attr("class", "link-labels")
            .selectAll("text")
            .data(this.links)
            .join("text")
            .attr("fill", "#94a3b8")
            .attr("font-size", "12px")
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .text(d => d.label);

        // Draw Nodes
        const node = this.svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(this.nodes)
            .join("g")
            .attr("class", "node")
            .attr("id", d => `node-${d.id}`)
            .call(this.drag(this.simulation));

        node.append("circle")
            .attr("r", 20);

        node.append("text")
            .text(d => d.label);
            
        // Initial state indicator
        if (machine.initialState) {
            node.filter(d => d.id === machine.initialState)
                .append("circle")
                .attr("r", 24)
                .attr("fill", "none")
                .attr("stroke", "#f59e0b")
                .attr("stroke-dasharray", "4,4")
                .attr("stroke-width", 2);
        }

        // Simulation Tick
        this.simulation.on("tick", () => {
            link.attr("d", d => {
                const dx = d.target.x - d.source.x,
                      dy = d.target.y - d.source.y,
                      dr = Math.sqrt(dx * dx + dy * dy);
                // Curve paths slightly to handle bi-directional edges
                const isSelfLoop = d.source === d.target;
                if (isSelfLoop) {
                    return `M${d.source.x},${d.source.y} A30,30 0 1,1 ${d.source.x+1},${d.source.y+1}`;
                }
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
            });

            linkLabels
                .attr("x", d => {
                    if (d.source === d.target) return d.source.x + 40;
                    return (d.source.x + d.target.x) / 2;
                })
                .attr("y", d => {
                    if (d.source === d.target) return d.source.y - 40;
                    return (d.source.y + d.target.y) / 2;
                });

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });
    }
    
    highlightStep(stepData) {
        // Reset all
        d3.selectAll('.node').classed('active', false);
        d3.selectAll('.link').classed('active', false).attr("marker-end", "url(#end)");
        
        // Highlight Nodes
        if (stepData.highlight_nodes) {
            stepData.highlight_nodes.forEach(nodeId => {
                d3.select(`#node-${nodeId}`).classed('active', true);
            });
        }
        
        // Highlight Edges
        if (stepData.highlight_edges) {
            stepData.highlight_edges.forEach(edgeId => {
                d3.select(`#link-${edgeId}`).classed('active', true).attr("marker-end", "url(#active-end)");
            });
        }
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.visualization = new VisualizationEngine('d3-container');
});
