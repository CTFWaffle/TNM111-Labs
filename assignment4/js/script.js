// For bundlers such as Vite and Webpack omit https://esm.sh/
import { select } from 'https://esm.sh/d3-selection';
import { forceSimulation, forceManyBody, forceX, forceCollide } from 'https://esm.sh/d3-force';
import { range } from 'https://esm.sh/d3-array';
import { drag } from 'https://esm.sh/d3-drag';

let colorScale = ['orange', 'lightblue', '#B19CD9'];
let xCenter = [100, 300, 500];

let numNodes = 100;
let nodes = range(numNodes).map(function(d, i) {
	return {
		radius: Math.random() * 25,
		category: i % 3
	}
});

let simulation = forceSimulation(nodes)
	.force('charge', forceManyBody().strength(5))
	.force('x', forceX().x(function(d) {
		return xCenter[d.category];
	}))
	.force('collision', forceCollide().radius(function(d) {
		return d.radius;
	}))
	.on('tick', ticked);

function ticked() {
	let u = select('svg g')
		.selectAll('circle')
		.data(nodes)
		.join('circle')
		.attr('r', function(d) {
			return d.radius;
		})
		.style('fill', function(d) {
			return colorScale[d.category];
		})
		.attr('cx', function(d) {
			return d.x;
		})
		.attr('cy', function(d) {
			return d.y;
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
    