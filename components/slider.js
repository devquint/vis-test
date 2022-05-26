class Slider {
    constructor(target, dataRange, callback,
                width = 500, height = 50,) {
        this.target = target;
        this.dataRange = dataRange;
        this.callback = callback;
        this.width = width;
        this.height = height;
    }

    initialize() {
        this.svg = d3.select(this.target)
            .append('svg')
            .attr('width', this.width + 'px')
            .attr('height', this.height + 'px')
            .attr('id', 'slider')
            .attr('class', 'slider');

        this.currentRange = this.dataRange;

        this.update(this.dataRange);
    }

    update(dataRange) {
        const parseDate = d3.timeParse('%Y-%m-%d');
        dataRange = [parseDate(this.dataRange[0]), parseDate(this.dataRange[1])];
        this.dataRange = [parseDate(this.dataRange[0]), parseDate(this.dataRange[1])];

        if (this.dataRange[0] != dataRange[0] || this.dataRange[1] != dataRange[1]) {
            this.currentRange = dataRange;
        }
        this.dataRange = dataRange;

        let actualWidth = this.width - 100;
        let actualHeight = this.height - 30;


        console.log(this.dataRange[0], this.dataRange[1]);
        const x = d3.scaleTime()
            .domain(this.dataRange)
            .range([20, actualWidth/*d3.timeDay.count(this.dataRange[0], this.dataRange[1])*/]);

        this.svg.selectAll('g').remove();
        const g = this.svg.append('g');

        const leftLabel = g.append('text')
            .attr('id', 'leftLabel')
            .attr('x', 0)
            .attr('y', actualHeight + 15);
        const rightLabel = g.append('text')
            .attr('id', 'rightLabel')
            .attr('x', 0)
            .attr('y', actualHeight + 30);
        const line = g.append('line')
            .attr('id', 'tracker')
            .attr('x1', 10 + x.range()[0])
            .attr('x2', 10 + x.range()[1]);

        const brush = d3.brushX()
            .extent([[20, 0], [actualWidth, actualHeight]])
            .on('brush', e => {
                let sel = e.selection;
                leftLabel.attr('x', sel[0])
                    .text((x.invert(sel[0]).toISOString().slice(0, 10)));
                rightLabel.attr('x', sel[1])
                    .text((x.invert(sel[1]).toISOString().slice(0, 10)));
                handle.attr("display", null)
                    .attr("transform", (d, i) => {
                        `translate([${sel[i]}, ${actualHeight / 4}])}`
                    });
                this.callback([x.invert(sel[0]), x.invert(sel[1])]);
                this.svg.node().value = sel.map(d => x.invert(d));
                this.svg.node().dispatchEvent(new CustomEvent("input"));
            });

        const sliderBrush = g.append('g')
            .attr('class', 'brush')
            .call(brush);

        // https://bl.ocks.org/Fil/2d43867ba1f36a05459c7113c7f6f98a
        var brushResizePath = function (d) {
            var e = +(d.type == "e"),
                x = e ? 1 : -1,
                y = height / 2;
            return "M" + (.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) +
                "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y) + "Z" + "M" + (2.5 * x) + "," + (y + 8) + "V" + (2 * y - 8) +
                "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
        }

        const handle = sliderBrush.selectAll(".handle")
            .data([{type: 'w'}, {type: 'e'}])
            .enter()
            .append('path')
            .attr('class', 'handle')
            .style('stroke', 'rgb(255,255,255)')
            .style('fill', 'rgb(127, 127, 255)')
            .attr('cursor', 'ew-resize')
            .attr('d', brushResizePath);

        sliderBrush.selectAll(".brushOverlay")
            .each(d => {
                d.type = "selection";
            })
            .on("mousedown touchstart", brushCenter);

        function brushCenter() {
            let dx = x(1) - x(0);
            let mouseCursor = d3.mouse(this)[0];
            let x0 = mouseCursor - dx / 2;
            let x1 = x0 + dx;
            console.log()
            d3.select(this.target).call(brush.move,
                x1 > actualWidth ?
                    [actualWidth - dx, actualWidth] :
                    x0 < 20 ?
                        [20, dx] : [x0, x1]);
        }

        sliderBrush.call(brush.move, this.currentRange.map(x));


    }
}
