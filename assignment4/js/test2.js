// For bundlers such as Vite and Webpack omit https://esm.sh/
import { select } from 'https://esm.sh/d3-selection';
import { forceSimulation, forceManyBody, forceX, forceCollide, forceCenter, forceLink } from 'https://esm.sh/d3-force';
import { range } from 'https://esm.sh/d3-array';
import { drag } from 'https://esm.sh/d3-drag';

document.addEventListener('DOMContentLoaded', () => {
    const fromSlider = document.getElementById('fromSlider');
    const toSlider = document.getElementById('toSlider');
    const fromInput = document.getElementById('fromInput');
    const toInput = document.getElementById('toInput');

    fromSlider.addEventListener('input', updateLinks);
    toSlider.addEventListener('input', updateLinks);

    fromInput.addEventListener('input', function () {
        fromSlider.value = this.value;
        updateLinks();
    });

    toInput.addEventListener('input', function () {
        toSlider.value = this.value;
        updateLinks();
    });    

    let minLinkValue;
    let maxLinkValue;

    fetch('./starwars-interactions/starwars-full-interactions-allCharacters.json')
        .then(response => response.json())
        .then(jsonData => {
            console.log('JSON data:', jsonData);
            console.log('nodes:', jsonData.nodes);

            minLinkValue = d3.min(jsonData.links, d => d.value);
            maxLinkValue = d3.max(jsonData.links, d => d.value);

            updateSlider(minLinkValue, maxLinkValue, true, true);

            const div = d3.select("#content1");
            const svg = d3.select("#content-svg1");

            // Create all episode visualization
            createGraph(div, svg, jsonData);
        })
        .catch(err => {
            console.error('Error reading JSON:', err);
        });

    // fromSlider.value = minLinkValue;
    // toSlider.value = maxLinkValue;
    // fromInput.value = minLinkValue;
    // toInput.value = maxLinkValue;
    
    
    const episodeBoxes = d3.selectAll('.episode');

    episodeBoxes.on("change", function () {
        const checkedValues = episodeBoxes
            .filter(function () {
                return this.checked;
            })
            .nodes()
            .map(node => parseInt(node.value));

        let jsonData = {
            nodes: [],
            links: []
        };

        const fetchPromises = checkedValues.map(episode =>
            fetch(`./starwars-interactions/starwars-episode-${episode}-interactions-allCharacters.json`)
                .then(response => response.json())
                .then(data => {
                    data.nodes.forEach(n => {
                        let existingNode = jsonData.nodes.find(node => node.name === n.name);
                        if (existingNode) {
                            existingNode.value += n.value;
                        } else {
                            jsonData.nodes.push({ ...n });
                        }
                    });

                    data.links.forEach(l => {
                        let sourceNode = jsonData.nodes.find(node => node.name === data.nodes[l.source].name);
                        let targetNode = jsonData.nodes.find(node => node.name === data.nodes[l.target].name);

                        if (sourceNode && targetNode) {
                            let existingLink = jsonData.links.find(link =>
                                (link.source === sourceNode && link.target === targetNode) ||
                                (link.source === targetNode && link.target === sourceNode)
                            );

                            if (existingLink) {
                                existingLink.value += l.value;
                            } else {
                                jsonData.links.push({
                                    source: sourceNode,
                                    target: targetNode,
                                    value: l.value
                                });
                            }
                        }
                    });
                })
        );

        Promise.all(fetchPromises).then(() => {
            const div = d3.select("#content2");
            const svg = d3.select("#content-svg2");

            // Clear previous SVG content
            svg.selectAll("*").remove();

            if (jsonData.nodes.length > 0) {
                const episodeMinLinkValue = Math.min(minLinkValue, d3.min(jsonData.links, d => d.value));
                const episodeMaxLinkValue = Math.max(maxLinkValue, d3.max(jsonData.links, d => d.value));
    
                updateSlider(episodeMinLinkValue, episodeMaxLinkValue, fromSlider.vale === fromSlider.min, toSlider.value === toSlider.max);
    
                createGraph(div, svg, jsonData);
            } else {
                // updateSlider(minLinkValue, maxLinkValue, true);
            }
        }).catch(err => {
            console.error('Error reading JSON:', err);
        });
    });

    function updateSlider(minValue, maxValue, setFromValue, setToValue) {
        fromSlider.min = minValue;
        fromSlider.max = maxValue;
        // fromSlider.value = minValue;

        toSlider.min = minValue;
        toSlider.max = maxValue;
        // toSlider.value = maxValue;

        fromInput.min = minValue;
        fromInput.max = maxValue;
        // fromInput.value = minValue;

        toInput.min = minValue;
        toInput.max = maxValue;
        // toInput.value = maxValue;

        if (setFromValue) {
            fromSlider.value = minValue;
            fromInput.value = minValue;
        }

        if (setToValue) {
            toSlider.value = maxValue;
            toInput.value = maxValue;
        }
    }

    function updateLinks() {
        const minVal = parseInt(fromSlider.value);
        const maxVal = parseInt(toSlider.value);
    
        d3.select("#content-svg1").selectAll('line')
            .style('visibility', function(d) {
                return (d.value >= minVal && d.value <= maxVal) ? 'visible' : 'hidden';
            });

        d3.select("#content-svg2").selectAll('line')
            .style('visibility', function(d) {
                return (d.value >= minVal && d.value <= maxVal) ? 'visible' : 'hidden';
            });
    }

    function createGraph(contentDiv, svg, jsonData) {
        const tooltip = d3.select("#tooltip");

        const { width, height } = contentDiv.node().getBoundingClientRect();

        const g = svg.append("g");

        let scale = 5;

        let nodes = jsonData.nodes;
        let links = jsonData.links;

        var nodeScale = d3.scaleLinear()
            .domain(d3.extent(nodes, function (d) { return d.value }))
            .range([3, 15])

        var linkScale = d3.scaleLinear()
            .domain(d3.extent(links, function (d) { return d.value }))
            .range([.25, 1.25])

        let simulation = forceSimulation(nodes)
            .force("link", d3.forceLink(links))
            .force('charge', forceManyBody().strength(5))
            .force('collision', forceCollide().radius(function (d) {
                return nodeScale(d.value) * 3;
            }))
            .force('center', forceCenter(width / 2, height / 2)) // Force center is always center of the content div 
            .on('tick', ticked);

        function ticked() {

            let link = g.selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke', 'black')
                .attr('stroke-width', d => linkScale(d.value))
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('class', d =>
                    d.source.name.replace(/[\/\s]+/g, '-') +
                    d.target.name.replace(/[\/\s]+/g, '-') +
                    " " +
                    d.source.name.replace(/[\/\s]+/g, '-') + 'link' +
                    " " +
                    d.target.name.replace(/[\/\s]+/g, '-') + 'link'
                )
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.source.name} - ${d.target.name}</strong><br/>Number of scenes together: ${d.value}`);

                    d3.selectAll('.' + d.source.name.replace(/[\/\s]+/g, '-') + d.target.name.replace(/[\/\s]+/g, '-'))
                        .attr("stroke-width", linkScale(d.value) * scale)
                        .attr("stroke", "red");
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("opacity", 0);

                    d3.selectAll('.' + d.source.name.replace(/[\/\s]+/g, '-') + d.target.name.replace(/[\/\s]+/g, '-'))
                        .attr("stroke-width", linkScale(d.value))
                        .attr("stroke", "black");
                });

            let node = g.selectAll('circle')
                .data(nodes)
                .join('circle')
                .attr('r', function (d) {
                    return nodeScale(d.value);
                })
                .style('fill', function (d) {
                    return d.colour;
                })
                .attr('cx', function (d) {
                    return d.x;
                })
                .attr('cy', function (d) {
                    return d.y;
                })
                .attr('class', d =>
                    d.name.replace(/[\/\s]+/g, '-')
                )
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.name}</strong><br/>Number of scenes: ${d.value}`);

                    d3.selectAll('.' + d.name.replace(/[\/\s]+/g, '-'))
                        .attr("stroke", "red")
                        .attr("stroke-width", 3);

                    d3.selectAll('.' + d.name.replace(/[\/\s]+/g, '-') + 'link')
                        .attr("stroke-width", function(d) {
                            return parseFloat(d3.select(this).attr("stroke-width")) * scale;
                        })
                        .attr("stroke", "red");
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("opacity", 0);

                    d3.selectAll('.' + d.name.replace(/[\/\s]+/g, '-')).attr("stroke", null);

                    d3.selectAll('.' + d.name.replace(/[\/\s]+/g, '-') + 'link')
                        .attr("stroke-width", function(d) {
                            return parseFloat(d3.select(this).attr("stroke-width")) / scale;
                        })
                        .attr("stroke", "black");
                })
                .call(drag(simulation)
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));


            updateLinks();
        }

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
    }
});