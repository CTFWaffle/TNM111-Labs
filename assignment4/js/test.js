// For bundlers such as Vite and Webpack omit https://esm.sh/
import { select } from 'https://esm.sh/d3-selection';
import { forceSimulation, forceManyBody, forceX, forceCollide, forceCenter, forceLink } from 'https://esm.sh/d3-force';
import { range } from 'https://esm.sh/d3-array';
import { drag } from 'https://esm.sh/d3-drag';

const svg = d3.select("content-svg1");
const tooltip = d3.select("#tooltip");

document.addEventListener('DOMContentLoaded', () => {
    const episodeBoxes = document.querySelectorAll('.episode-box');
    const slider = document.getElementById('episode-slider');

    if (!episodeBoxes.length || !slider) {
        console.error('Episode boxes or slider not found in the DOM.');
        return;
    }

    episodeBoxes.forEach(box => {
        box.addEventListener('input', filterEpisodes);
    });
    slider.addEventListener('input', filterEpisodes);

    function filterEpisodes() {
        const selectedEpisodes = Array.from(episodeBoxes)
            .filter(box => box.value)
            .map(box => parseInt(box.value));
        const sliderValue = parseInt(slider.value);

        const filteredEpisodes = jsonData.nodes.filter(node => {
            return selectedEpisodes.includes(node.episode) && node.episode <= sliderValue;
        });

        updateVisualization(filteredEpisodes);
    }

    function updateVisualization(filteredEpisodes) {
        const contentDiv = document.getElementById("content2");
        const { width, height } = contentDiv.getBoundingClientRect();

        // Clear previous SVG content
        contentDiv.innerHTML = '';

        // Create a new SVG element
        const svg = d3.select("#content2").append("svg")
            .attr("width", width)
            .attr("height", height);

        let nodes = filteredEpisodes;
        let links = jsonData.links.filter(link => {
            return nodes.some(node => node.id === link.source.id || node.id === link.target.id);
        });

        let simulation = forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force('charge', forceManyBody().strength(5))
            .force('collision', forceCollide().radius(d => nodeScale(d.value) * 3))
            .force('center', forceCenter(width / 2, height / 2))
            .on('tick', ticked);

        function ticked() {
            let link = svg.selectAll('line')
                .data(links)
                .join('line')
                .attr('stroke', 'black')
                .attr('stroke-width', d => linkScale(d.value))
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            let node = svg.selectAll('circle')
                .data(nodes)
                .join('circle')
                .attr('r', d => nodeScale(d.value))
                .style('fill', d => d.colour)
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        }
    }

    fetch('./starwars-interactions/starwars-full-interactions-allCharacters.json')
        .then(response => response.json())
        .then(jsonData => {
            console.log('JSON data:', jsonData);
            console.log('nodes:', jsonData.nodes);
            let nodes = jsonData.nodes;
            let links = jsonData.links;

            var nodeScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.value))
                .range([3, 15]);

            var linkScale = d3.scaleLinear()
                .domain(d3.extent(links, d => d.value))
                .range([.25, 1.25]);

            // Initial visualization
            updateVisualization(nodes);
        })
        .catch(err => {
            console.error('Error reading JSON:', err);
        });
});