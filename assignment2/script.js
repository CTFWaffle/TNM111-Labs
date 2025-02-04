// Function to load and parse CSV data
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

            // Get max Y value from second column
            let maxX = Math.max(...structuredData.map(d => d.x));
            let minX = Math.min(...structuredData.map(d => d.x));
            let maxY = Math.max(...structuredData.map(d => d.y));
            let minY = Math.min(...structuredData.map(d => d.y));

            minX = Math.min(minX, 0);
            minY = Math.min(minY, 0);

            // Get distinct categories from third column
            let uniqueCategories = [...new Set(structuredData.map(d => d.category).filter(v => v))];

            return { maxX, minX, maxY, minY, uniqueCategories, structuredData };
        });
}

let leftMargin = 20;
let bottomMargin = 20;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d'),
    w = canvas.width - leftMargin,
    h = canvas.height - bottomMargin;

function normalize(v, minV, maxV, scale) {
    return ((v - minV)/(maxV-minV)) * (scale);
}

// ctx.fillStyle = "red";

// CSV and plot data
loadCSV("data2.csv").then(({ maxX, minX, maxY, minY, uniqueCategories, structuredData }) =>  {

    // Display categories
    const categoriesCanvas = document.getElementById("categories");
    const categoriesCtx = categoriesCanvas.getContext("2d");

    categoriesCtx.clearRect(0, 0, categoriesCanvas.width, categoriesCanvas.height);

    // Category 1
    categoriesCtx.fillRect(10, 13, 6, 6);
    categoriesCtx.fillText(uniqueCategories[0], 20, 20);

    // Category 2
    categoriesCtx.beginPath();
    categoriesCtx.arc(12, 35, 3, 0, 2 * Math.PI);
    categoriesCtx.fill();
    categoriesCtx.fillText(uniqueCategories[1], 20, 40);

    // Category 3
    categoriesCtx.beginPath();
    categoriesCtx.moveTo(12, 57 - 4);
    categoriesCtx.lineTo(12 + 3, 57 + 3);
    categoriesCtx.lineTo(12 - 3, 57 + 3);
    categoriesCtx.closePath();
    categoriesCtx.fill();
    categoriesCtx.fillText(uniqueCategories[2], 20, 60);

    // Extra padding
    let steps = 8;
    let xAxisStep = Math.floor((maxX - minX) / steps);
    let yAxisStep = Math.floor((maxY - minY) / steps);

    maxX += xAxisStep;
    minX -= xAxisStep;
    maxY += yAxisStep;
    minY -= yAxisStep;

    structuredData.forEach((point, index) => { 
        let x = leftMargin + normalize(point.x, minX, maxX, w);
        let y = h - normalize(point.y, minY, maxY, h);

        if (point.category === uniqueCategories[0]) {
            // Draw rectangle
            ctx.fillRect(x-3, y-3, 6, 6);
        } else if (point.category === uniqueCategories[1]) {
            // Draw circle
            ctx.beginPath();
            ctx.arc(x-3, y-3, 3, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Draw triangle
            ctx.beginPath();
            ctx.moveTo(x, y - 4);
            ctx.lineTo(x + 3, y + 3);
            ctx.lineTo(x - 3, y + 3);
            ctx.closePath();
            ctx.fill();
        }
        
        // Comment this to not print the data
        // ctx.fillText(`${point.x}, ${point.y}, ${point.category}`, x + 9, y + 3);
    });

    // Draw y-axis
    ctx.beginPath();
    ctx.moveTo(leftMargin, h);
    ctx.lineTo(leftMargin, 0);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw x-axis
    ctx.beginPath();
    ctx.moveTo(canvas.width, h);
    ctx.lineTo(leftMargin, h);
    ctx.stroke();

    // draw scale per axis step
    let index = 0;

    // Draw x-axis steps
    while(index * xAxisStep <= maxX || (-1) * index * xAxisStep >= minX) {
        let valX = index * xAxisStep;
        let xPosP = leftMargin + normalize(valX, minX, maxX, w);
        let xPosN = leftMargin + normalize((-1) * valX, minX, maxX, w);

        if (valX <= maxX) {
            ctx.beginPath();
            ctx.moveTo(xPosP, h+5);
            ctx.lineTo(xPosP, h);
            ctx.stroke();
            ctx.fillText(valX.toFixed(0), xPosP - 5, h + 15);
        }

        if ((-1)* valX >= minX) {
            ctx.beginPath();
            ctx.moveTo(xPosN, h+5);
            ctx.lineTo(xPosN, h);
            ctx.stroke();
            ctx.fillText(((-1)*valX).toFixed(0), xPosN - 5, h + 15);
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
            ctx.beginPath();
            ctx.beginPath();
            ctx.moveTo(leftMargin-5, yPosP);
            ctx.lineTo(leftMargin, yPosP);
            ctx.stroke();
            ctx.fillText(valY.toFixed(0), leftMargin - 20, yPosP + 3);
        }

        if ((-1)* valY >= minY) {
            ctx.beginPath();
            ctx.beginPath();
            ctx.moveTo(leftMargin-5, yPosN);
            ctx.lineTo(leftMargin, yPosN);
            ctx.stroke();
            ctx.fillText(((-1) * valY).toFixed(0), leftMargin - 20, yPosN + 3);
        }

        index++;
    }
});
