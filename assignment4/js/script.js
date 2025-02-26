// For bundlers such as Vite and Webpack omit https://esm.sh/
import { select } from 'https://esm.sh/d3-selection';
import { forceSimulation, forceManyBody, forceX, forceCollide, forceCenter, forceLink } from 'https://esm.sh/d3-force';
import { range } from 'https://esm.sh/d3-array';
import { drag } from 'https://esm.sh/d3-drag';

const svg = d3.select("#content-svg");
const tooltip = d3.select("#tooltip");

fetch('./starwars-interactions/starwars-full-interactions-allCharacters.json')
.then(response => response.json())
.then(jsonData => {
	console.log('JSON data:', jsonData);
	console.log('nodes:', jsonData.nodes);
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
		.force('collision', forceCollide().radius(function(d) {
			return nodeScale(d.value) * 3;
		}))
		.force('center', forceCenter(350, 20)) // TODO: should depend on width and height 
		.on('tick', ticked);

	function ticked() {

		let link = select('svg g')
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke', 'black') // or whatever color you want
			.attr('stroke-width', d => linkScale(d.value))
			.attr('x1', d => d.source.x)
			.attr('y1', d => d.source.y)
			.attr('x2', d => d.target.x)
			.attr('y2', d => d.target.y)
			.on("mouseover", function(event, d) {
				tooltip
				  .style("opacity", 1)
				  .html(`<strong>${d.source.name} - ${d.target.name}</strong><br/>Number of scenes together: ${d.value}`);
		  
				  d3.select(this).attr("stroke-width", linkScale(d.value) + 0.5);
				  d3.select(this).attr("stroke", "red");
			})
			.on("mouseout", function(event, d) {
				tooltip.style("opacity", 0);
		  
				d3.select(this).attr("stroke-width", linkScale(d.value));
				d3.select(this).attr("stroke", "black");
			});

		let node = select('svg g')
			.selectAll('circle')
			.data(nodes)
			.join('circle')
			.attr('r', function(d) {
				return nodeScale(d.value);
			})
			.style('fill', function(d) {
				return d.colour;
			})
			.attr('cx', function(d) {
				return d.x;
			})
			.attr('cy', function(d) {
				return d.y;
			})
			.on("mouseover", function(event, d) {
				tooltip
				  .style("opacity", 1)
				  .html(`<strong>${d.name}</strong><br/>Number of scenes: ${d.value}`);
		  
				d3.select(this).attr("stroke", "black");
			})
			.on("mouseout", function(event, d) {
				tooltip.style("opacity", 0);
		  
				d3.select(this).attr("stroke", null);
			})
			.call(drag(simulation)
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));
	}

	function dragstarted(event, d){
		if(!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d){
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d){
		if(!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
		
})
.catch(err => {
  console.error('Error reading JSON:', err);
});