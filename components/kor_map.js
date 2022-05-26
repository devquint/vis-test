class KorMap {
    constructor(target, data, selected, callback,
                width = 700, height = 700,
                scale = 5500,
                offsetX = -11900, offsetY = 4050) {
        this.target = target;
        this.data = data;
        this.selected = selected;
        this.callback = callback;
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    initialize() {
        this.projection = d3.geoMercator()
            .scale(this.scale)
            .translate([this.offsetX, this.offsetY]);
        this.path = d3.geoPath().projection(this.projection);

        this.svg = d3.select(this.target)
            .append('svg')
            .attr('width', this.width + 'px')
            .attr('height', this.height + 'px')
            .attr('id', 'kor_map')
            .attr('class', 'kor_map');

        this.states = this.svg
            .append('g')
            .attr('id', 'states');

        this.states
            .append('rect')
            .attr('class', 'background')
            .attr('width', this.width + 'px')
            .attr('height', this.height + 'px');

        var projection = this.projection;
        d3.json('https://raw.githubusercontent.com/devquint/vis-test/master/data/korea.json').then(json => {
            let selected = this.selected;
            var tmp = json;
            this.mapData = tmp;

            this.update(this.data);
        });
    }

    update(data) {
        this.data = data;
        this.targetTemp = "avgTemp";

        const categories = [...new Set(this.data.map(d => d["posName"]))];
        const counts = {};
        const sums = {};
        const avgs = {};

        categories.forEach(c => {
            counts[c] = 0;
            sums[c] = 0.0;
        });

        this.data.forEach(item => {
            counts[item["posName"]] += 1;
            sums[item["posName"]] += item[this.targetTemp];
        });

        var maxTemp = -1;
        var minTemp = 100;

        categories.forEach(c => {
            avgs[c] = sums[c] / counts[c];
            if (avgs[c] > maxTemp) maxTemp = avgs[c];
            if (avgs[c] < minTemp) minTemp = avgs[c];
        });

        d3.select(this.target).select('.tooltip').remove();
        this.states.selectAll('path').remove();
        this.states.selectAll('text').remove();

        let selected = this.selected;
        var colorMapper = function (d) {
            var content = d3.scaleSequential()
                .interpolator(d3.interpolate("blue", "red"))
                .domain([minTemp, maxTemp]);
            if (selected.get(d.properties.name) == true) {
                return content(avgs[d.properties.name]);
            } else {
                return "rgb(50, 50, 50)";
            }
        };

        var hoverColorMapper = function (d) {
            var content = d3.scaleSequential()
                .interpolator(d3.interpolate("#4444aa", "#aa4444"))
                .domain([minTemp, maxTemp]);
            if (selected.get(d.properties.name) == true) {
                return content(avgs[d.properties.name]);
            } else {
                return "rgb(150, 150, 150)";
            }
        };

        var tooltip = d3.select(this.target)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        let states = this.states;
        var mouseover = function (d) {
            let properties = d.target.__data__.properties;
            states.select('#path-' + properties.name)
                .style("stroke", "black")
                .style("opacity", 2)
                .style("fill", hoverColorMapper(d.target.__data__));

            if (selected.get(properties.name) == false) {
                tooltip
                    .style("opacity", 0)
            } else {
                tooltip
                    .style("opacity", 1)
            }
        };
        var mousemove = function (d) {
            let properties = d.target.__data__.properties;

            tooltip
                .html("Average temperature of " + properties.name + ": " + avgs[properties.name] + "°C")
                .style("left", (d3.pointer(this)[0] + 70) + "px")
                .style("top", (d3.pointer(this)[1]) + "px")
        };
        var mouseleave = function (d) {
            let properties = d.target.__data__.properties;
            tooltip
                .style("opacity", 0)
            let target = states.select('#path-' + properties.name);
            target
                .style("stroke", "#aaa")
                .style("opacity", 1.5)
                .style("fill", colorMapper(d.target.__data__));
        }

        let callback = this.callback;


        var projection = this.projection;
        this.states
            .selectAll('path')
            .data(this.mapData.features)
            .enter()
            .append('path')
            .attr('d', this.path)
            .attr('id', function (d) {
                //console.log('path-' + d.properties.name_eng);
                return 'path-' + d.properties.name;
            })
            .attr('class', "state-selected")
            .style('fill', function (d) {
                return colorMapper(d);
            })
            .on('click', function (d, i) {
                let properties = d.target.__data__.properties;
                if (selected.has(properties.name) && selected.get(properties.name) == false) {
                    selected.set(properties.name, true);
                    d3.select(this).classed("state-selected", true);
                } else {
                    selected.set(properties.name, false);
                    d3.select(this).classed("state-selected", false);
                }
                callback();
            })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave);


        this.labels = this.states
            .selectAll('text')
            .data(this.mapData.features)
            .enter()
            .append('text')
            .attr("x", function (d) {
                return projection(d3.geoCentroid(d))[0];
            })
            .attr("y", function (d) {
                var offset = 0;
                if (d.properties.name == "충청남도") {
                    offset += 10;
                } else if (d.properties.name == "경기도") {
                    offset += 30;
                }
                return projection(d3.geoCentroid(d))[1] + offset;
            })
            .attr('id', function (d) {
                return 'label-' + d.properties.name;
            })
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .text(function (d) {
                return d.properties.name;
            })
            .on('click', function (d, i) {
                let properties = d.target.__data__.properties;
                if (selected.has(properties.name) && selected.get(properties.name) == false) {
                    selected.set(properties.name, true);
                    d3.select(this).classed("state-selected", true);
                } else {
                    selected.set(properties.name, false);
                    d3.select(this).classed("state-selected", false);
                }
                callback();
            })
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave);


    }
}
