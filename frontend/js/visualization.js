/**
 * Interactive D3.js Visualization Engine
 * Features:
 * - Dynamic SVG rendering for both Moore and Mealy machines
 * - Moore: state / output inside node circle
 * - Mealy: input / output on transition arrow
 * - Force-directed layout with collision detection & drag physics
 * - Smooth animated traveling particles along directed edges during simulation
 * - Active node shockwave pulse effect
 * - Multi-view mode: Original Only, Converted Only, or Side-by-Side Dual View
 * - Zoom & Pan navigation controls (+, -, reset)
 */
class VisualizationEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentViewMode = 'single'; // 'single' or 'dual'
        this.activeMachineTab = 'original'; // 'original' or 'converted'

        this.originalMachine = null;
        this.convertedMachine = null;

        // D3 graphs storage
        this.graphA = null; // Original
        this.graphB = null; // Converted

        this.initDOM();
        this.initEventListeners();
    }

    initDOM() {
        document.getElementById('view-tab-orig')?.addEventListener('click', () => this.setViewTab('original'));
        document.getElementById('view-tab-conv')?.addEventListener('click', () => this.setViewTab('converted'));
        document.getElementById('view-tab-dual')?.addEventListener('click', () => this.setViewTab('dual'));

        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoom(1.25));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.resetZoom());
    }

    initEventListeners() {
        // Machine updated live from user input table / JSON
        window.addEventListener('machine-updated', (e) => {
            this.originalMachine = e.detail;
            if (this.activeMachineTab === 'original' || this.currentViewMode === 'dual') {
                this.render();
            }
        });

        // Machine converted from backend
        window.addEventListener('machine-converted', (e) => {
            this.convertedMachine = e.detail.converted_machine;
            this.originalMachine = window.machineInput ? window.machineInput.getMachineJSON() : null;

            // Unlock converted tab
            const tabConv = document.getElementById('view-tab-conv');
            const tabDual = document.getElementById('view-tab-dual');
            if (tabConv) {
                tabConv.classList.remove('opacity-50', 'pointer-events-none');
                tabConv.classList.add('cursor-pointer');
            }
            if (tabDual) {
                tabDual.classList.remove('opacity-50', 'pointer-events-none');
                tabDual.classList.add('cursor-pointer');
            }

            // Automatically switch to converted view or dual view to display conversion
            this.setViewTab('converted');
        });

        // Conversion step change highlight
        window.addEventListener('step-changed', (e) => {
            this.highlightStep(e.detail);
        });

        // Simulation step animation event
        window.addEventListener('sim-step-active', (e) => {
            this.animateSimulationStep(e.detail);
        });

        window.addEventListener('sim-reset', () => {
            this.clearHighlights();
        });

        // Initial render after brief delay to allow container dimensions to settle
        setTimeout(() => {
            if (window.machineInput) {
                this.originalMachine = window.machineInput.getMachineJSON();
                this.render();
            }
        }, 300);
    }

    setViewTab(tab) {
        const btnOrig = document.getElementById('view-tab-orig');
        const btnConv = document.getElementById('view-tab-conv');
        const btnDual = document.getElementById('view-tab-dual');

        [btnOrig, btnConv, btnDual].forEach(b => {
            b?.classList.remove('bg-cyber-accent/20', 'text-cyber-accent', 'border-cyber-accent/40');
            b?.classList.add('text-gray-400');
        });

        if (tab === 'dual') {
            this.currentViewMode = 'dual';
            btnDual?.classList.add('bg-cyber-accent/20', 'text-cyber-accent', 'border-cyber-accent/40');
            btnDual?.classList.remove('text-gray-400');
        } else if (tab === 'converted') {
            if (!this.convertedMachine) {
                alert("Please convert a machine first to view the converted graph.");
                return;
            }
            this.currentViewMode = 'single';
            this.activeMachineTab = 'converted';
            btnConv?.classList.add('bg-cyber-accent/20', 'text-cyber-accent', 'border-cyber-accent/40');
            btnConv?.classList.remove('text-gray-400');
        } else {
            this.currentViewMode = 'single';
            this.activeMachineTab = 'original';
            btnOrig?.classList.add('bg-cyber-accent/20', 'text-cyber-accent', 'border-cyber-accent/40');
            btnOrig?.classList.remove('text-gray-400');
        }

        this.render();
    }

    render() {
        const container = d3.select(`#${this.containerId}`);
        container.selectAll("*").remove();

        const bounds = container.node().getBoundingClientRect();
        const width = bounds.width || 700;
        const height = bounds.height || 450;

        if (this.currentViewMode === 'dual' && this.convertedMachine && this.originalMachine) {
            // Dual side-by-side view
            const halfWidth = width / 2;

            const wrap = container.append("div")
                .attr("class", "grid grid-cols-1 md:grid-cols-2 w-full h-full divide-y md:divide-y-0 md:divide-x divide-gray-800");

            const divA = wrap.append("div").attr("class", "relative w-full h-full flex flex-col");
            divA.append("div")
                .attr("class", "absolute top-2 left-3 z-10 text-[11px] font-mono font-bold text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-md border border-sky-500/30 backdrop-blur-sm")
                .text(`ORIGINAL (${this.originalMachine.type.toUpperCase()}) - ${this.originalMachine.states.length} States`);
            const svgA = divA.append("svg").attr("width", "100%").attr("height", "100%");

            const divB = wrap.append("div").attr("class", "relative w-full h-full flex flex-col");
            divB.append("div")
                .attr("class", "absolute top-2 left-3 z-10 text-[11px] font-mono font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-500/30 backdrop-blur-sm")
                .text(`CONVERTED (${this.convertedMachine.type.toUpperCase()}) - ${this.convertedMachine.states.length} States`);
            const svgB = divB.append("svg").attr("width", "100%").attr("height", "100%");

            this.graphA = this.mountGraph(svgA, this.originalMachine, halfWidth, height, 'orig');
            this.graphB = this.mountGraph(svgB, this.convertedMachine, halfWidth, height, 'conv');

        } else {
            // Single view
            const machineToRender = (this.activeMachineTab === 'converted' && this.convertedMachine) 
                ? this.convertedMachine 
                : this.originalMachine;

            if (!machineToRender) {
                container.append("div")
                    .attr("class", "flex items-center justify-center w-full h-full text-gray-500 font-mono text-sm")
                    .text("No machine loaded.");
                return;
            }

            const headerBadge = container.append("div")
                .attr("class", "absolute top-3 left-4 z-10 flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg backdrop-blur-md border " + (machineToRender.type === 'moore' ? 'bg-sky-950/70 text-sky-300 border-sky-500/40' : 'bg-purple-950/70 text-purple-300 border-purple-500/40'))
                .html(`
                    <span class="w-2 h-2 rounded-full ${machineToRender.type === 'moore' ? 'bg-sky-400' : 'bg-purple-400'} animate-ping"></span>
                    ${machineToRender.type.toUpperCase()} MACHINE • ${machineToRender.states.length} STATES • INITIAL: ${machineToRender.initialState || 'none'}
                `);

            const svg = container.append("svg").attr("width", "100%").attr("height", "100%");
            this.graphA = this.mountGraph(svg, machineToRender, width, height, 'single');
            this.graphB = null;
        }
    }

    mountGraph(svgSelection, machine, width, height, prefix) {
        // Setup SVG markers and filters for neon glow
        const defs = svgSelection.append("defs");

        // Arrowhead markers
        const markers = [
            { id: `${prefix}-end`, color: "#64748b" },
            { id: `${prefix}-active-end`, color: "#38bdf8" },
            { id: `${prefix}-pulse-end`, color: "#f59e0b" }
        ];

        markers.forEach(m => {
            defs.append("marker")
                .attr("id", m.id)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 26) // Distance from node center
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("fill", m.color)
                .attr("d", "M0,-5L10,0L0,5");
        });

        // Neon Glow Filter
        const filter = defs.append("filter").attr("id", `${prefix}-glow`);
        filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Zoom Container
        const gMain = svgSelection.append("g").attr("class", "zoom-layer");
        const zoomBehavior = d3.zoom()
            .scaleExtent([0.3, 3])
            .on("zoom", (event) => {
                gMain.attr("transform", event.transform);
            });
        svgSelection.call(zoomBehavior);

        // Nodes & Links Data
        const nodes = machine.states.map(s => ({
            id: s,
            name: s,
            output: machine.type === 'moore' ? (machine.outputs ? machine.outputs[s] : '') : null,
            isInitial: (s === machine.initialState)
        }));

        const links = machine.transitions.map((t, idx) => ({
            id: `${prefix}-link-${t.from}-${t.input}-${t.to}-${idx}`,
            source: t.from,
            target: t.to,
            input: t.input,
            output: machine.type === 'mealy' ? t.output : null,
            label: machine.type === 'mealy' ? `${t.input}/${t.output}` : `${t.input}`
        }));

        // D3 Force Physics
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(140))
            .force("charge", d3.forceManyBody().strength(-700))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(45));

        // Group for Links
        const linkGroup = gMain.append("g").attr("class", "links");
        const linkElements = linkGroup.selectAll("path")
            .data(links)
            .join("path")
            .attr("class", "link")
            .attr("id", d => d.id)
            .attr("stroke", "#475569")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .attr("marker-end", `url(#${prefix}-end)`);

        // Group for Link Labels
        const labelGroup = gMain.append("g").attr("class", "link-labels");
        const labelElements = labelGroup.selectAll("g")
            .data(links)
            .join("g")
            .attr("class", "link-label-group");

        labelElements.append("rect")
            .attr("class", "label-bg")
            .attr("fill", "#0f172a")
            .attr("rx", 4)
            .attr("opacity", 0.85);

        labelElements.append("text")
            .attr("class", "label-text font-mono font-bold text-[11px]")
            .attr("fill", machine.type === 'mealy' ? "#c084fc" : "#94a3b8")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .text(d => d.label);

        // Group for Nodes
        const nodeGroup = gMain.append("g").attr("class", "nodes");
        const nodeElements = nodeGroup.selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node cursor-grab active:cursor-grabbing")
            .attr("id", d => `${prefix}-node-${d.id}`)
            .call(this.drag(simulation));

        // Node Outer Ring for Initial State (dashed golden ring)
        nodeElements.filter(d => d.isInitial)
            .append("circle")
            .attr("r", 25)
            .attr("fill", "none")
            .attr("stroke", "#f59e0b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,3")
            .attr("class", "animate-spin-slow origin-center");

        // Node Main Body
        nodeElements.append("circle")
            .attr("r", 20)
            .attr("class", "transition-all duration-300")
            .attr("fill", "#1e293b")
            .attr("stroke", machine.type === 'moore' ? "#38bdf8" : "#a855f7")
            .attr("stroke-width", 2);

        // Node Text
        nodeElements.append("text")
            .attr("class", "font-mono font-bold text-xs select-none")
            .attr("fill", "#f8fafc")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .text(d => {
                if (machine.type === 'moore' && d.output !== null && d.output !== undefined) {
                    return `${d.name}/${d.output}`;
                }
                return d.name;
            });

        // Simulation physics loop
        simulation.on("tick", () => {
            linkElements.attr("d", d => {
                const isSelf = (d.source.id === d.target.id);
                if (isSelf) {
                    // Self loop arc above node
                    const x = d.source.x;
                    const y = d.source.y;
                    return `M ${x - 12} ${y - 16} A 25 25 0 1 1 ${x + 12} ${y - 16}`;
                }

                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // slight curve
                return `M ${d.source.x} ${d.source.y} A ${dr} ${dr} 0 0,1 ${d.target.x} ${d.target.y}`;
            });

            labelElements.attr("transform", d => {
                if (d.source.id === d.target.id) {
                    return `translate(${d.source.x}, ${d.source.y - 48})`;
                }
                const mx = (d.source.x + d.target.x) / 2;
                const my = (d.source.y + d.target.y) / 2;
                return `translate(${mx}, ${my})`;
            });

            // Adjust label backgrounds to fit text
            labelElements.each(function () {
                const text = d3.select(this).select("text");
                const bbox = text.node().getBBox();
                d3.select(this).select("rect")
                    .attr("x", bbox.x - 3)
                    .attr("y", bbox.y - 2)
                    .attr("width", bbox.width + 6)
                    .attr("height", bbox.height + 4);
            });

            nodeElements.attr("transform", d => `translate(${d.x}, ${d.y})`);
        });

        return {
            svg: svgSelection,
            gMain,
            zoomBehavior,
            simulation,
            nodeElements,
            linkElements,
            prefix,
            machine
        };
    }

    drag(simulation) {
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
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    highlightStep(stepData) {
        // Reset previous highlights
        d3.selectAll('.node circle')
            .attr("stroke-width", 2)
            .attr("filter", null);
        d3.selectAll('.link')
            .attr("stroke", "#475569")
            .attr("stroke-width", 2)
            .attr("filter", null);

        if (stepData.highlight_nodes) {
            stepData.highlight_nodes.forEach(name => {
                const node = d3.selectAll(`[id$="-node-${name}"] circle`);
                node.attr("stroke", "#38bdf8")
                    .attr("stroke-width", 4)
                    .attr("filter", `url(#single-glow)`);
            });
        }
    }

    animateSimulationStep(detail) {
        // detail: { fromState, symbol, toState, output, stepIndex }
        const { fromState, symbol, toState } = detail;
        const targetGraph = this.graphA;
        if (!targetGraph) return;

        const { gMain, prefix } = targetGraph;

        // Reset highlights
        d3.selectAll('.node circle').attr("stroke-width", 2).attr("filter", null);
        d3.selectAll('.link').attr("stroke", "#475569").attr("stroke-width", 2);

        // Highlight 'from' node
        const fromNode = d3.select(`#${prefix}-node-${fromState}`);
        if (!fromNode.empty()) {
            fromNode.select("circle")
                .attr("stroke", "#38bdf8")
                .attr("stroke-width", 4)
                .attr("filter", `url(#${prefix}-glow)`);
        }

        // Find transition link
        const targetLink = d3.selectAll(`path[id^="${prefix}-link-${fromState}-${symbol}-${toState}"]`);
        if (!targetLink.empty()) {
            targetLink
                .attr("stroke", "#38bdf8")
                .attr("stroke-width", 3.5)
                .attr("marker-end", `url(#${prefix}-active-end)`)
                .attr("filter", `url(#${prefix}-glow)`);

            // Animated Energy Particle travelling along the SVG path
            const pathNode = targetLink.node();
            if (pathNode) {
                const pathLength = pathNode.getTotalLength();
                const particle = gMain.append("circle")
                    .attr("r", 6)
                    .attr("fill", "#38bdf8")
                    .attr("filter", `url(#${prefix}-glow)`)
                    .attr("opacity", 1);

                particle.transition()
                    .duration(500)
                    .ease(d3.easeCubicOut)
                    .attrTween("transform", function () {
                        return function (t) {
                            const point = pathNode.getPointAtLength(t * pathLength);
                            return `translate(${point.x}, ${point.y})`;
                        };
                    })
                    .on("end", () => {
                        particle.remove();
                        // Pulse the destination node upon packet arrival
                        const toNode = d3.select(`#${prefix}-node-${toState}`);
                        if (!toNode.empty()) {
                            toNode.select("circle")
                                .attr("stroke", "#10b981")
                                .attr("stroke-width", 4)
                                .attr("filter", `url(#${prefix}-glow)`);

                            // Shockwave ring animation
                            const shockwave = toNode.append("circle")
                                .attr("r", 20)
                                .attr("fill", "none")
                                .attr("stroke", "#10b981")
                                .attr("stroke-width", 3)
                                .attr("opacity", 1);

                            shockwave.transition()
                                .duration(400)
                                .attr("r", 38)
                                .attr("opacity", 0)
                                .remove();
                        }
                    });
            }
        }
    }

    clearHighlights() {
        d3.selectAll('.node circle').attr("stroke-width", 2).attr("filter", null);
        d3.selectAll('.link').attr("stroke", "#475569").attr("stroke-width", 2);
    }

    zoom(scaleFactor) {
        if (this.graphA) {
            this.graphA.svg.transition().duration(250).call(this.graphA.zoomBehavior.scaleBy, scaleFactor);
        }
        if (this.graphB) {
            this.graphB.svg.transition().duration(250).call(this.graphB.zoomBehavior.scaleBy, scaleFactor);
        }
    }

    resetZoom() {
        if (this.graphA) {
            this.graphA.svg.transition().duration(350).call(this.graphA.zoomBehavior.transform, d3.zoomIdentity);
        }
        if (this.graphB) {
            this.graphB.svg.transition().duration(350).call(this.graphB.zoomBehavior.transform, d3.zoomIdentity);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.visualization = new VisualizationEngine('d3-container');
});
