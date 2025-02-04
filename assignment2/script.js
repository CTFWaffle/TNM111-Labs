var ctx = canvas.getContext('2d'),
    w = canvas.width,
    h = canvas.height - 10, // give room for point/text
    maxHeight = 1000,
    axisStep = 100;

    function myLog(v, max) {
        var n = v / max;          // normalize
        return n * n * n;         // some log formula
    }

    // draw scale per axis step
    for(var i = 0; i < maxHeight; i += axisStep) {

        // get normalized value, multiply with canvas height and reverse axis
        var y = h - myLog(i, maxHeight) * h;

        // show axis mark each 100
        ctx.moveTo(0, y);
        ctx.lineTo(20, y);
        }

        ctx.lineWidth=2;
        ctx.stroke();
        ctx.fillStyle = "red";

        // some random points between 0 and max height
        for(var x = 30; x < w; x += 30) {
        var v = Math.random() * maxHeight,   // some value
            y = h - myLog(v, maxHeight) * h; // convert to y in canvas
        ctx.fillRect(x, y, 7, 7);
        ctx.fillText(v.toFixed(0), x + 9, y +7);
    }