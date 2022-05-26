class LineChart {
    constructor(target, data, types, callback,
                width = 900, height = 800,) {
        this.target = target;
        this.data = data;
        this.types = types;
        this.callback = callback;
        this.width = width;
        this.height = height;
    }

    initialize() {

        this.svg = d3.select(this.target)
            .append('svg')
            .attr('width', this.width + 'px')
            .attr('height', this.height + 'px')
            .attr('id', 'linechart')
            .attr('class', 'linechart');

        this.update(this.data);
    }

    update(data) {
        this.data = data;

        const margin = {
            top: 50,
            right: 50,
            left: 50,
            bottom: 50
        };

        const parseDate = d3.timeParse('%Y-%m-%d');

        const usingData = this.data.map(d => {
            return {
                date: parseDate(d["date"]),
                state: d["posName"],
                avgTemp: d["avgTemp"],
                highTemp: d["highTemp"],
                lowTemp: d["lowTemp"],
            };
        });

        this.svg.selectAll('g').remove();

        var statData = d3.group(usingData, d => d.state);

        const actualWidth = this.width - margin.left - margin.right - 120;
        const actualHeight = this.height - margin.top - margin.bottom;

        const x = d3.scaleTime()
            .range([0, actualWidth])
            .domain(d3.extent(usingData, d => d.date));
        const y = d3.scaleLinear()
            .range([actualHeight, 0])
            .domain([d3.min(usingData, d => d.lowTemp) - 1, d3.max(usingData, d => d.highTemp) + 1]);

        const xAxis = d3.axisBottom(x)
            .tickSize(-actualHeight)
            .tickPadding(10);
        const yAxis = d3.axisLeft(y)
            .tickSize(-actualWidth)
            .tickPadding(10);

        this.g = this.svg
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const axes = this.g.append('g');

        axes.append('g')
            .attr('class', 'x-axis')
            .attr('transform', 'translate(0,' + actualHeight + ')')
            .call(xAxis)
        axes.append('text')
            .attr('x', actualWidth)
            .attr('y', actualHeight + 20)
            .text('Date');

        axes.append('g')
            .attr('class', 'y-axis')
            .call(yAxis)
        axes.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.75em')
            .style('text-anchor', 'end')
            .text('Temperature(°C)');


        const categories = [...new Set(usingData.map(d => d.state))];
        console.log(usingData);
        const colorsRaw = ["#3957ff", "#d3fe14", "#c9080a", "#fec7f8", "#0b7b3e", "#0bf0e9", "#c203c8", "#fd9b39", "#888593", "#906407", "#98ba7f", "#fe6794", "#10b0ff", "#ac7bff", "#fee7c0", "#964c63", "#1da49c",];
        const colorsRange = [];
        const colorsValue = [];
        for (const x of colorsRaw) {
            colorsRange.push(`${x}${categories.length > 5 ? (categories.length > 10 ? 3 : 5) : (9 - categories.length)}0`);
            colorsValue.push(`${x}`);
        }

        var rangeColors = d3.scaleOrdinal()
            .domain(categories)
            .range(colorsRange);
        var valueColors = d3.scaleOrdinal()
            .domain(categories)
            .range(colorsValue);

        const legend = this.g.append('g');
        legend.append('text')
            .attr('x', this.width - 200)
            .attr('y', 10)
            .text("Range: Lowest Temperature ")
            .style('font-size', 10);
        legend.append('text')
            .attr('x', this.width - 200 + 30)
            .attr('y', 10 + 15)
            .text("~ Highest Temperature")
            .style('font-size', 10);
        legend.append('text')
            .attr('x', this.width - 200)
            .attr('y', 10 + 25 + 10)
            .text("Line: Average Temperature")
            .style('font-size', 12);
        legend.selectAll(".legend_square")
            .data(categories)
            .enter()
            .append('rect')
            .attr('x', this.width - 200)
            .attr('y', (d, i) => {
                return 10 + (i + 2) * (25)
            })
            .attr('width', 20)
            .attr('height', 20)
            .style('fill', d => valueColors(d));
        legend.selectAll(".legend_text")
            .data(categories)
            .enter()
            .append('text')
            .attr('x', this.width - 200 + 20 + 5)
            .attr('y', (d, i) => {
                return 10 + (i + 2) * (25) + 10
            })
            .text(d => d)
            .style('fill', d => valueColors(d))
            .style('text-anchor', 'left')
            .style('alignment-baseline', 'middle');


        var highArea = d3.area()
            .x(d => x(d.date))
            .y0(d => y(d.highTemp))
            .y1(d => y(d.lowTemp));


        this.g.selectAll(".area")
            .data(statData)
            .enter()
            .append("path")
            .attr('d', d => highArea(d[1]))
            .style('fill', d => {
                return rangeColors(d[0]);
            });

        var valueLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(+d.avgTemp));
        this.g.selectAll(".line")
            .data(statData)
            .enter()
            .append("path")
            .attr('d', d => valueLine(d[1]))
            .style('stroke', d => {
                return valueColors(d[0]);
            })
            .style('stroke-width', 1)
            .style('fill', 'none');

    }
}
