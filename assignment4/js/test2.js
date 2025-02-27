// For bundlers such as Vite and Webpack omit https://esm.sh/
import { select } from 'https://esm.sh/d3-selection';
import { forceSimulation, forceManyBody, forceX, forceCollide, forceCenter, forceLink } from 'https://esm.sh/d3-force';
import { range } from 'https://esm.sh/d3-array';
import { drag } from 'https://esm.sh/d3-drag';

document.addEventListener('DOMContentLoaded', () => {
    const episodeBoxes = d3.selectAll('.episode');
    console.log(episodeBoxes);

    episodeBoxes.on("change", function () {
        const checkedValues = episodeBoxes
            .filter(function () {
                return this.checked;
            })
            .nodes()
            .map(node => parseInt(node.value));

        // Now do something with the updated array of checked values
        console.log("Checked Values:", checkedValues);

        fetch('./starwars-interactions/starwars-episode-1-interactions-allCharacters.json')
        .then(response => response.json())
        .then(jsonData => {
            console.log('JSON data:', jsonData);
            console.log('nodes:', jsonData.nodes);

            const div = d3.select("#content2");
            const svg = d3.select("#content-svg2");

            // Create all episode visualization
            createGraph(div, svg, jsonData);
        })
        .catch(err => {
            console.error('Error reading JSON:', err);
        });
    });

    fetch('./starwars-interactions/starwars-full-interactions-allCharacters.json')
        .then(response => response.json())
        .then(jsonData => {
            console.log('JSON data:', jsonData);
            console.log('nodes:', jsonData.nodes);

            const div = d3.select("#content1");
            const svg = d3.select("#content-svg1");

            // Create all episode visualization
            createGraph(div, svg, jsonData);
        })
        .catch(err => {
            console.error('Error reading JSON:', err);
        });

    function createGraph(contentDiv, svg, jsonData) {
        const tooltip = d3.select("#tooltip");

        // Clear previous SVG content
        svg.selectAll("*").remove();
        const { width, height } = contentDiv.node().getBoundingClientRect();

        // Create a new SVG element
        // const svg = contentDiv.append("svg")
        //     .attr("width", width) //TODO
        //     .attr("height", height);

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
            .force('center', forceCenter(width / 3, height / 4)) // Force center is always center of the content div 
            .on('tick', ticked);

        function ticked() {

            let link = g.selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke', 'black') // or whatever color you want
                .attr('stroke-width', d => linkScale(d.value))
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)
                .attr('class', d => 
                    d.source.name.replace(/\s+/g, '-') +
                    d.target.name.replace(/\s+/g, '-')
                )
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.source.name} - ${d.target.name}</strong><br/>Number of scenes together: ${d.value}`);

                    d3.selectAll('.' + d.source.name.replace(/\s+/g, '-') + d.target.name.replace(/\s+/g, '-'))
                        .attr("stroke-width", linkScale(d.value) * scale)
                        .attr("stroke", "red");
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("opacity", 0);

                    d3.selectAll('.' + d.source.name.replace(/\s+/g, '-') + d.target.name.replace(/\s+/g, '-'))
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
                    d.name.replace(/\s+/g, '-')
                )
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.name}</strong><br/>Number of scenes: ${d.value}`);

                    d3.selectAll('.' + d.name.replace(/\s+/g, '-'))
                        .attr("stroke", "red", 5);

                    link.filter(function (l) {
                        return l.source === d || l.target === d;
                    }).attr("stroke", "red")
                        .attr("stroke-width", function (l) {
                            return linkScale(l.value) * scale;
                        });
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("opacity", 0);
                    link.attr("stroke", "black")
                        .attr("stroke-width", function (l) {
                            return linkScale(l.value);
                        });
                        d3.selectAll('.' + d.name.replace(/\s+/g, '-')).attr("stroke", null);
                })
                .call(drag(simulation)
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));
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