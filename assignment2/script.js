// Load and parse CSV data
function loadCSV(file) {
    return fetch(file)
        .then(response => response.text())
        .then(data => {
            let rows = data.split("\n").map(row => row.split(",")); // Split into rows and columns

            // Extract structured data
            let structuredData = rows.slice(1).map(row => ({
                x: parseFloat(row[0]),
                y: parseFloat(row[1]),  
                category: row[2]?.trim()
            })).filter(d => !isNaN(d.x) && !isNaN(d.y));

            // Get max and min X and Y value from first and second column
            let maxX = Math.max(...structuredData.map(d => d.x));
            let minX = Math.min(...structuredData.map(d => d.x));
            let maxY = Math.max(...structuredData.map(d => d.y));
            let minY = Math.min(...structuredData.map(d => d.y));

            // Get distinct categories from third column
            let uniqueCategories = [...new Set(structuredData.map(d => d.category).filter(v => v))];

            return { maxX, minX, maxY, minY, uniqueCategories, structuredData };
        });
}

let rightSelected = null;
let leftSelected = null;
let leftMargin = 20;
let bottomMargin = 20;

const svg = document.getElementById("svg");

const w = svg.getAttribute("width") - leftMargin;
const h = svg.getAttribute("height") - bottomMargin;

// Get values normalized between minV and maxV and then scaled by scale
function normalize(v, minV, maxV, scale) {
    return ((v - minV)/(maxV-minV)) * (scale);
}

// Create visualisation
loadCSV("data1.csv").then(({ maxX, minX, maxY, minY, uniqueCategories, structuredData }) =>  {
    let radius = 5;

    //******** Display categories ********
    const catSvg = document.getElementById("categories");

    let startX = 10;
    let startY = 20;
    let verticalGap = 25; 

    uniqueCategories.forEach((cat, i) => {
        let yPos = startY + i * verticalGap;
    
        let shape;

        if (i === 0) {
          // Category 1 - rectangle
          shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          shape.setAttribute("x", startX - radius);
          shape.setAttribute("y", yPos - radius);
          shape.setAttribute("width", 2 * radius);
          shape.setAttribute("height", 2 * radius);
        } else if (i === 1) {
          /// Category 2 - circle
          shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          shape.setAttribute("cx", startX);
          shape.setAttribute("cy", yPos);
          shape.setAttribute("r", radius);
        } else {
          // Category 3 - triangle
          shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          let triPoints = [
            `${startX},${yPos - radius}`,
            `${startX + radius},${yPos + radius}`,
            `${startX - radius},${yPos + radius}`
          ].join(" ");
          shape.setAttribute("points", triPoints);
        }
    
        catSvg.appendChild(shape);
    
        // Display category label
        let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", startX + 15);
        label.setAttribute("y", yPos + 4);
        label.setAttribute("font-size", "14");
        label.textContent = cat;
    
        catSvg.appendChild(label);
    });


    //******** Create the scatter plot ********

    // Calculate a reasonable step size for the particularr data set
    let steps = 8;
    let xAxisStep = Math.floor((maxX - minX) / steps);
    let yAxisStep = Math.floor((maxY - minY) / steps);

    // Add extra padding so that no point is exactly on the axes
    maxX += xAxisStep;
    minX = minX > xAxisStep ? 0 : minX - xAxisStep;
    maxY += yAxisStep;
    minY = minY > yAxisStep ? 0 : minY - yAxisStep;

    // Plot the data
    structuredData.forEach((point, index) => { 
        let x = leftMargin + normalize(point.x, minX, maxX, w);
        let y = h - normalize(point.y, minY, maxY, h);

        let shape;

        if (point.category === uniqueCategories[0]) {
            // Draw rectangle
            shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            shape.setAttribute("x", x - radius);
            shape.setAttribute("y", y - radius);
            shape.setAttribute("width", 2*radius);
            shape.setAttribute("height", 2*radius);
        } else if (point.category === uniqueCategories[1]) {
            // Draw circle
            shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            shape.setAttribute("cx", x);
            shape.setAttribute("cy", y);
            shape.setAttribute("r", radius);
        } else {
            // Draw triangle
            shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            const triPoints = [
                `${x},${y - radius}`, 
                `${x + radius},${y + radius}`,
                `${x - radius},${y + radius}`
            ].join(" ");
            shape.setAttribute("points", triPoints);
        }

        shape.setAttribute("class", "point");
        shape.setAttribute("x_val", point.x);
        shape.setAttribute("y_val", point.y);
        
        // For debugging purposes, this is how you display the data next to the plotted points
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x + 9);
        label.setAttribute("y", y + 3);
        label.textContent = `${point.x}, ${point.y}, ${point.category}`;
        label.setAttribute("font-size", "9");
        // Comment this to not print data info
        // svg.appendChild(label);


        // Handle left-click event
        shape.addEventListener("click", (e) => {
            // Left-click select

            // For debugging
            console.log(`Left-clicked shape at data coords: (${point.x}, ${point.y}, ${point.category})`);

            const points = document.querySelectorAll(".point");
            
            // Fill points with colour depending on quadrants
            if (leftSelected === null || !(leftSelected.x == point.x && leftSelected.y == point.y)) {
                points.forEach((p) => {
                    if (p.getAttribute("x_val") < point.x) {
                        if (p.getAttribute("y_val") < point.y) {
                            // Third quadrant: Green
                            p.setAttribute("fill", "green");
                        } else {
                            // Second quadrant: Blue
                            p.setAttribute("fill", "blue");
                        }
                    } else {
                        if (p.getAttribute("y_val") < point.y) {
                            //Fourth quadrant: Red
                            p.setAttribute("fill", "red");
                        } else {
                            //First quadrant: Orange
                            p.setAttribute("fill", "orange");
                        }
                    }

                    p.setAttribute("stroke", "none");
                });

                // Highlight selected point 
                shape.setAttribute("fill", "black");
                
                leftSelected = point;
                rightSelected = null;
            } else {
                // Left-click deselect
                points.forEach((p) => {
                    p.setAttribute("fill", "black");
                })

                leftSelected = null;
                shape.setAttribute("stroke", "none");
            }            
            
        });
    
        // Handle right-click event 
        shape.addEventListener("contextmenu", (e) => {
            // Prevent default menu
            e.preventDefault();

            // For debugging
            console.log(`Right-clicked shape at data coords: (${point.x}, ${point.y}, ${point.category})`);

            const points = document.querySelectorAll(".point");

            if (rightSelected === null || (rightSelected.x != point.x && rightSelected.y != point.y)) {
                // Right-click select

                let distances = []; 
                points.forEach((p) => {
                    // Get euclidean distance
                    let dist = Math.sqrt((p.getAttribute("x_val") - point.x)**2 + (p.getAttribute("y_val") - point.y)**2);

                    distances.push({ dist, point: p });

                    // Reset colour to default black
                    p.setAttribute("fill", "black");
                });

                // Sort data based on distance
                distances.sort((a, b) => a.dist - b.dist);

                // The closest  points are the first 5 + 1 (the point we selected will be the first)
                const closestFive = distances.slice(1, 6);

                closestFive.forEach(({ point }) => {
                    // Highlight closest five
                    point.setAttribute("fill", "red");
                    point.setAttribute("stroke", "none");
                });

                rightSelected = point;

                // Highlight selected point
                shape.setAttribute("fill", "yellow");
                shape.setAttribute("stroke", "black");

                leftSelected = null;
            } else {
                // Right-click deselect
                points.forEach((p) => {
                    p.setAttribute("fill", "black");
                    p.setAttribute("stroke", "none");
                })

                rightSelected = null;
            }

        });
        
    
        svg.appendChild(shape);
    });

    // Draw y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", leftMargin);
    yAxis.setAttribute("y1", 0);
    yAxis.setAttribute("x2", leftMargin);
    yAxis.setAttribute("y2", h);
    yAxis.setAttribute("stroke", "black");
    svg.appendChild(yAxis);

    
    
    // Draw x-axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", leftMargin);
    xAxis.setAttribute("y1", h);
    xAxis.setAttribute("x2", leftMargin + w);
    xAxis.setAttribute("y2", h);
    xAxis.setAttribute("stroke", "black");
    svg.appendChild(xAxis);


    // draw scale per axis step
    let index = 0;

    // Draw x-axis steps
    while(index * xAxisStep <= maxX || (-1) * index * xAxisStep >= minX) {
        let valX = index * xAxisStep;
        let xPosP = leftMargin + normalize(valX, minX, maxX, w);
        let xPosN = leftMargin + normalize((-1) * valX, minX, maxX, w);

        if (valX <= maxX) {
            // Tick line
            const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tickLine.setAttribute("x1", xPosP);
            tickLine.setAttribute("y1", h);
            tickLine.setAttribute("x2", xPosP);
            tickLine.setAttribute("y2", h + 5);
            tickLine.setAttribute("stroke", "black");
            svg.appendChild(tickLine);

            // Tick label
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("x", xPosP - 5);
            tickLabel.setAttribute("y", h + 15);
            tickLabel.textContent = valX.toFixed(0);
            tickLabel.setAttribute("font-size", "9");
            svg.appendChild(tickLabel);
        }

        if ((-1)* valX >= minX) {
            // Tick line
            const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tickLine.setAttribute("x1", xPosN);
            tickLine.setAttribute("y1", h);
            tickLine.setAttribute("x2", xPosN);
            tickLine.setAttribute("y2", h + 5);
            tickLine.setAttribute("stroke", "black");
            svg.appendChild(tickLine);

            // Tick label
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("x", xPosN - 5);
            tickLabel.setAttribute("y", h + 15);
            tickLabel.textContent = (-valX).toFixed(0);
            tickLabel.setAttribute("font-size", "9");
            svg.appendChild(tickLabel);
        }

        index++;
    }

    index = 0;

    // Draw y-axis steps
    while(index * yAxisStep <= maxY || (-1) * index * yAxisStep >= minY) {
        let valY = index * yAxisStep;
        let yPosP = h - normalize(valY, minY, maxY, h);
        let yPosN = h - normalize((-1) * valY, minY, maxY, h);

        if (valY <= maxY) {
            // Tick line
            const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tickLine.setAttribute("x1", leftMargin - 5);
            tickLine.setAttribute("y1", yPosP);
            tickLine.setAttribute("x2", leftMargin);
            tickLine.setAttribute("y2", yPosP);
            tickLine.setAttribute("stroke", "black");
            svg.appendChild(tickLine);

            // 2) Tick label
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("x", leftMargin - 20); 
            tickLabel.setAttribute("y", yPosP + 3);
            tickLabel.textContent = valY.toFixed(0);
            tickLabel.setAttribute("font-size", "9");
            svg.appendChild(tickLabel);
        }

        if ((-1)* valY >= minY) {

            // Tick line
            const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            tickLine.setAttribute("x1", leftMargin - 5);
            tickLine.setAttribute("y1", yPosN);
            tickLine.setAttribute("x2", leftMargin);
            tickLine.setAttribute("y2", yPosN);
            tickLine.setAttribute("stroke", "black");
            svg.appendChild(tickLine);

            // 2) Tick label
            const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            tickLabel.setAttribute("x", leftMargin - 20); 
            tickLabel.setAttribute("y", yPosN + 3);
            tickLabel.textContent = (-valY).toFixed(0);
            tickLabel.setAttribute("font-size", "9");
            svg.appendChild(tickLabel);
        }

        index++;
    }
});
