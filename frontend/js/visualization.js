/**
 * Interactive D3.js Visualization Engine
 * Features:
 * - Robust handling of state machines of any size (5, 9, 15+ states)
 * - Safe D3 force layout: isolates self-loops from forceLink to prevent division-by-zero explosions
 * - Clamps node coordinates so states never fly off screen or behind badges
 * - Initial state indicator: textbook Automata incoming "Start" arrow + fixed golden border (NO roaming/spinning ring)
 * - Combines parallel transitions (e.g. 0 and 1) between same source and target to avoid visual overlap
 * - Distinct styling for Moore (state / output in circle) and Mealy (input / output on arrow)
 * - Multi-view mode: Original View, Converted View, and Side-by-Side Dual View
 * - Zoom & Pan with reset controls
 */
class VisualizationEngine {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentViewMode = 'single'; // 'single' or 'dual'
        this.activeMachineTab = 'original'; // 'original' or 'converted'

        this.originalMachine = null;
        this.convertedMachine = null;

        this.graphA = null;
        this.graphB = null;

        this.initDOM();
        this.initEventListeners();
    }

    initDOM() {
        document.getElementById('view-tab-orig')?.addEventListener('click', () => this.setViewTab('original'));
        document.getElementById('view-tab-conv')?.addEventListener('click', () => this.setViewTab('converted'));
        document.getElementById('view-tab-dual')?.addEventListener('click', () => this.setViewTab('dual'));

        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoom(1.2));
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoom(0.8));
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.resetZoom());
    }

    initEventListeners() {
        window.addEventListener('machine-updated', (e) => {
            this.originalMachine = e.detail;
            if (this.activeMachineTab === 'original' || this.currentViewMode === 'dual') {
                this.render();
            }
        });

        window.addEventListener('machine-converted', (e) => {
            this.convertedMachine = e.detail.converted_machine;
            this.originalMachine = window.machineInput ? window.machineInput.getMachineJSON() : null;

            // Unlock tabs
            ['view-tab-conv', 'view-tab-dual'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.classList.remove('opacity-50', 'pointer-events-none');
                    el.classList.add('cursor-pointer');
                }
            });

            this.setViewTab('converted');
        });

        window.addEventListener('step-changed', (e) => {
            this.highlightStep(e.detail);
        });

        window.addEventListener('sim-step-active', (e) => {
            this.animateSimulationStep(e.detail);
        });

        window.addEventListener('sim-reset', () => {
            this.clearHighlights();
        });

        window.addEventListener('resize', () => {
            this.render();
        });

        setTimeout(() => {
            if (window.machineInput) {
                this.originalMachine = window.machineInput.getMachineJSON();
                this.render();
            }
        }, 200);
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
        const width = Math.max(bounds.width || 700, 400);
        const height = Math.max(bounds.height || 420, 380);

        if (this.currentViewMode === 'dual' && this.convertedMachine && this.originalMachine) {
            const halfWidth = width / 2;
            const wrap = container.append("div")
                .attr("class", "grid grid-cols-1 md:grid-cols-2 w-full h-full divide-y md:divide-y-0 md:divide-x divide-gray-800");

            const divA = wrap.append("div").attr("class", "relative w-full h-full flex flex-col");
            divA.append("div")
                .attr("class", "absolute top-2 left-3 z-10 text-[11px] font-mono font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-md border border-sky-500/40 backdrop-blur-sm")
                .text(`ORIGINAL (${this.originalMachine.type.toUpperCase()}) • ${this.originalMachine.states.length} States`);
            const svgA = divA.append("svg").attr("width", "100%").attr("height", "100%");

            const divB = wrap.append("div").attr("class", "relative w-full h-full flex flex-col");
            divB.append("div")
                .attr("class", "absolute top-2 left-3 z-10 text-[11px] font-mono font-bold text-purple-400 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/40 backdrop-blur-sm")
                .text(`CONVERTED (${this.convertedMachine.type.toUpperCase()}) • ${this.convertedMachine.states.length} States`);
            const svgB = divB.append("svg").attr("width", "100%").attr("height", "100%");

            this.graphA = this.mountGraph(svgA, this.originalMachine, halfWidth, height, 'orig');
            this.graphB = this.mountGraph(svgB, this.convertedMachine, halfWidth, height, 'conv');

        } else {
            const machineToRender = (this.activeMachineTab === 'converted' && this.convertedMachine) 
                ? this.convertedMachine 
                : this.originalMachine;

            if (!machineToRender || !machineToRender.states || machineToRender.states.length === 0) {
                container.append("div")
                    .attr("class", "flex items-center justify-center w-full h-full text-gray-500 font-mono text-sm")
                    .text("No machine loaded.");
                return;
            }

            container.append("div")
                .attr("class", "absolute top-3 left-4 z-10 flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-lg " + (machineToRender.type === 'moore' ? 'bg-sky-950/80 text-sky-300 border-sky-500/40' : 'bg-purple-950/80 text-purple-300 border-purple-500/40'))
                .html(`
                    <span class="w-2 h-2 rounded-full ${machineToRender.type === 'moore' ? 'bg-sky-400' : 'bg-purple-400'}"></span>
                    ${machineToRender.type.toUpperCase()} MACHINE • ${machineToRender.states.length} STATES • START: ${machineToRender.initialState || 'none'}
                `);

            const svg = container.append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 ${width} ${height}`);

            this.graphA = this.mountGraph(svg, machineToRender, width, height, 'single');
            this.graphB = null;
        }
    }

    mountGraph(svgSelection, machine, width, height, prefix) {
        const defs = svgSelection.append("defs");

        // Markers for arrows
        const markerConfigs = [
            { id: `${prefix}-end`, color: "#64748b" },
            { id: `${prefix}-active-end`, color: "#38bdf8" },
            { id: `${prefix}-start-arrow`, color: "#f59e0b" }
        ];

        markerConfigs.forEach(m => {
            defs.append("marker")
                .attr("id", m.id)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 25)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("fill", m.color)
                .attr("d", "M0,-5L10,0L0,5");
        });

        // Glow Filter
        const filter = defs.append("filter").attr("id", `${prefix}-glow`);
        filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "blur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Zoom Layer
        const gMain = svgSelection.append("g").attr("class", "zoom-layer");
        const zoomBehavior = d3.zoom()
            .scaleExtent([0.4, 2.5])
            .on("zoom", (event) => {
                gMain.attr("transform", event.transform);
            });
        svgSelection.call(zoomBehavior);

        // 1. Build Nodes with seeded radial positions around center
        const numStates = machine.states.length;
        const radius = Math.min(width, height) * 0.33;
        const angleStep = (2 * Math.PI) / (numStates || 1);

        const nodes = machine.states.map((s, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            return {
                id: s,
                name: s,
                output: (machine.type === 'moore' && machine.outputs) ? machine.outputs[s] : null,
                isInitial: (s === machine.initialState),
                x: width / 2 + Math.cos(angle) * radius,
                y: height / 2 + Math.sin(angle) * radius
            };
        });

        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        // 2. Group Transitions between same source and target to combine labels cleanly
        // key: "from->to"
        const groupedTransitions = new Map();

        (machine.transitions || []).forEach(t => {
            const srcNode = nodeMap.get(t.from);
            const tgtNode = nodeMap.get(t.to);
            if (!srcNode || !tgtNode) return; // Ignore dangling references

            const key = `${t.from}->${t.to}`;
            if (!groupedTransitions.has(key)) {
                groupedTransitions.set(key, {
                    from: t.from,
                    to: t.to,
                    source: srcNode,
                    target: tgtNode,
                    isSelfLoop: (t.from === t.to),
                    items: []
                });
            }

            const itemLabel = (machine.type === 'mealy' && t.output !== undefined)
                ? `${t.input}/${t.output}`
                : `${t.input}`;

            groupedTransitions.get(key).items.push({
                input: t.input,
                output: t.output,
                label: itemLabel
            });
        });

        const links = [];
        let linkCounter = 0;

        groupedTransitions.forEach((grp, key) => {
            const reverseKey = `${grp.to}->${grp.from}`;
            const hasOpposite = groupedTransitions.has(reverseKey) && !grp.isSelfLoop;

            // Combined label e.g. "0/0, 1/1"
            const combinedLabel = grp.items.map(it => it.label).join(', ');

            links.push({
                id: `${prefix}-link-${grp.from}-${grp.to}`,
                source: grp.source,
                target: grp.target,
                isSelfLoop: grp.isSelfLoop,
                hasOpposite: hasOpposite,
                label: combinedLabel,
                items: grp.items
            });
            linkCounter++;
        });

        // 3. D3 Force Simulation
        // CRITICAL: NEVER pass self-loops into d3.forceLink because (source === target) causes distance 0 division-by-zero!
        const nonSelfLinks = links.filter(l => !l.isSelfLoop);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(nonSelfLinks).id(d => d.id).distance(120).strength(0.45))
            .force("charge", d3.forceManyBody().strength(-350))
            .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
            .force("collide", d3.forceCollide().radius(36))
            .alphaDecay(0.04);

        // 4. Draw Links
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

        // 5. Draw Link Labels
        const labelGroup = gMain.append("g").attr("class", "link-labels");
        const labelElements = labelGroup.selectAll("g")
            .data(links)
            .join("g")
            .attr("class", "link-label-group");

        labelElements.append("rect")
            .attr("fill", "#090d16")
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 1)
            .attr("rx", 4);

        labelElements.append("text")
            .attr("class", "font-mono font-bold text-[11px]")
            .attr("fill", machine.type === 'mealy' ? "#c084fc" : "#7dd3fc")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .text(d => d.label);

        // 6. Draw Nodes
        const nodeGroup = gMain.append("g").attr("class", "nodes");
        const nodeElements = nodeGroup.selectAll("g")
            .data(nodes)
            .join("g")
            .attr("class", "node cursor-grab active:cursor-grabbing")
            .attr("id", d => `${prefix}-node-${d.id}`)
            .call(this.drag(simulation));

        // Node Main Body
        nodeElements.append("circle")
            .attr("class", "main-circle")
            .attr("r", 20)
            .attr("fill", "#151d30")
            .attr("stroke", d => {
                if (d.isInitial) return "#f59e0b"; // Gold for initial state
                return machine.type === 'moore' ? "#38bdf8" : "#a855f7";
            })
            .attr("stroke-width", d => d.isInitial ? 3 : 2);

        // Node Label
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

        // 7. Initial State Indicator Arrow ("Start" -> q0)
        const initialNode = nodes.find(n => n.isInitial);
        let startArrow = null;
        let startLabel = null;

        if (initialNode) {
            startArrow = gMain.append("path")
                .attr("class", "start-pointer")
                .attr("stroke", "#f59e0b")
                .attr("stroke-width", 2.5)
                .attr("fill", "none")
                .attr("marker-end", `url(#${prefix}-start-arrow)`);

            startLabel = gMain.append("text")
                .attr("class", "font-mono font-bold text-[10px]")
                .attr("fill", "#f59e0b")
                .attr("text-anchor", "middle")
                .text("Start");
        }

        // 8. Simulation Tick Loop
        simulation.on("tick", () => {
            // Keep all nodes clamped inside the visible viewport
            nodes.forEach(d => {
                d.x = Math.max(35, Math.min(width - 35, d.x));
                d.y = Math.max(45, Math.min(height - 35, d.y));
            });

            // Update Link Paths
            linkElements.attr("d", d => {
                if (d.isSelfLoop) {
                    // Smooth loop arc over node
                    const x = d.source.x;
                    const y = d.source.y;
                    return `M ${x - 12} ${y - 16} A 20 20 0 1 1 ${x + 12} ${y - 16}`;
                }

                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy);

                if (d.hasOpposite) {
                    // Curve reciprocal links so they don't overlap
                    return `M ${d.source.x} ${d.source.y} A ${dr * 1.15} ${dr * 1.15} 0 0,1 ${d.target.x} ${d.target.y}`;
                }

                // Straight or subtle curve
                return `M ${d.source.x} ${d.source.y} L ${d.target.x} ${d.target.y}`;
            });

            // Update Label Positions
            labelElements.attr("transform", d => {
                if (d.isSelfLoop) {
                    return `translate(${d.source.x}, ${d.source.y - 42})`;
                }

                if (d.hasOpposite) {
                    // Arc midpoint
                    const mx = (d.source.x + d.target.x) / 2;
                    const my = (d.source.y + d.target.y) / 2;
                    const dx = d.target.x - d.source.x;
                    const dy = d.target.y - d.source.y;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / len;
                    const ny = dx / len;
                    const offset = 16;
                    return `translate(${mx + nx * offset}, ${my + ny * offset})`;
                }

                const mx = (d.source.x + d.target.x) / 2;
                const my = (d.source.y + d.target.y) / 2;
                return `translate(${mx}, ${my - 5})`;
            });

            // Fit label background boxes
            labelElements.each(function () {
                const text = d3.select(this).select("text");
                const bbox = text.node().getBBox();
                d3.select(this).select("rect")
                    .attr("x", bbox.x - 4)
                    .attr("y", bbox.y - 2)
                    .attr("width", bbox.width + 8)
                    .attr("height", bbox.height + 4);
            });

            // Move Nodes
            nodeElements.attr("transform", d => `translate(${d.x}, ${d.y})`);

            // Move Start Arrow
            if (initialNode && startArrow && startLabel) {
                const sx = initialNode.x - 46;
                const sy = initialNode.y;
                const ex = initialNode.x - 22;
                const ey = initialNode.y;
                startArrow.attr("d", `M ${sx} ${sy} L ${ex} ${ey}`);
                startLabel.attr("x", sx + 5).attr("y", sy - 8);
            }
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
        d3.selectAll('.node circle.main-circle')
            .attr("stroke-width", d => d && d.isInitial ? 3 : 2)
            .attr("filter", null);

        d3.selectAll('.link')
            .attr("stroke", "#475569")
            .attr("stroke-width", 2)
            .attr("filter", null);

        if (stepData.highlight_nodes) {
            stepData.highlight_nodes.forEach(name => {
                const node = d3.selectAll(`[id$="-node-${name}"] circle.main-circle`);
                node.attr("stroke", "#38bdf8")
                    .attr("stroke-width", 4)
                    .attr("filter", `url(#single-glow)`);
            });
        }
    }

    animateSimulationStep(detail) {
        const { fromState, symbol, toState } = detail;
        const targetGraph = this.graphA;
        if (!targetGraph) return;

        const { gMain, prefix } = targetGraph;

        d3.selectAll('.node circle.main-circle').attr("stroke-width", d => d && d.isInitial ? 3 : 2).attr("filter", null);
        d3.selectAll('.link').attr("stroke", "#475569").attr("stroke-width", 2);

        const fromNode = d3.select(`#${prefix}-node-${fromState}`);
        if (!fromNode.empty()) {
            fromNode.select("circle.main-circle")
                .attr("stroke", "#38bdf8")
                .attr("stroke-width", 4);
        }

        const targetLink = d3.select(`#${prefix}-link-${fromState}-${toState}`);
        if (!targetLink.empty()) {
            targetLink
                .attr("stroke", "#38bdf8")
                .attr("stroke-width", 3.5)
                .attr("marker-end", `url(#${prefix}-active-end)`);

            const pathNode = targetLink.node();
            if (pathNode) {
                const pathLength = pathNode.getTotalLength();
                const particle = gMain.append("circle")
                    .attr("r", 5.5)
                    .attr("fill", "#38bdf8")
                    .attr("opacity", 1);

                particle.transition()
                    .duration(450)
                    .ease(d3.easeCubicOut)
                    .attrTween("transform", function () {
                        return function (t) {
                            const point = pathNode.getPointAtLength(t * pathLength);
                            return `translate(${point.x}, ${point.y})`;
                        };
                    })
                    .on("end", () => {
                        particle.remove();
                        const toNode = d3.select(`#${prefix}-node-${toState}`);
                        if (!toNode.empty()) {
                            toNode.select("circle.main-circle")
                                .attr("stroke", "#10b981")
                                .attr("stroke-width", 4);
                        }
                    });
            }
        }
    }

    clearHighlights() {
        d3.selectAll('.node circle.main-circle')
            .attr("stroke-width", d => d && d.isInitial ? 3 : 2)
            .attr("filter", null);
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
            this.graphA.svg.transition().duration(300).call(this.graphA.zoomBehavior.transform, d3.zoomIdentity);
        }
        if (this.graphB) {
            this.graphB.svg.transition().duration(300).call(this.graphB.zoomBehavior.transform, d3.zoomIdentity);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.visualization = new VisualizationEngine('d3-container');
});
