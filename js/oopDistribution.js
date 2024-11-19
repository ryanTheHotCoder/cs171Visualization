class OOPDistributionVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Define margins and initial dimensions
        vis.margin = { top: 20, right: 20, bottom: 50, left: 70 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = vis.width * 0.5 - vis.margin.top - vis.margin.bottom;

        // Create SVG container
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Scales
        vis.xScale = d3.scaleLinear().range([0, vis.width]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        // Axes
        vis.xAxis = vis.svg.append("g").attr("transform", `translate(0,${vis.height})`);
        vis.yAxis = vis.svg.append("g");

        // Axis labels
        vis.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .text("Out-of-Pocket Costs ($)");

        vis.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .text("Frequency");

        // Tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Attach event listeners to filters
        d3.select("#genderFilter").on("change", () => vis.wrangleData());
        d3.select("#raceFilter").on("change", () => vis.wrangleData());

        vis.wrangleData();
    }

    wrangleData() {
        const vis = this;

        // Get selected filter values
        const selectedGender = d3.select("#genderFilter").property("value");
        const selectedRace = d3.select("#raceFilter").property("value");

        vis.filteredData = vis.data.filter(d => {
            const genderMatch = selectedGender === "all" || +d.CSP_SEX === (selectedGender === "male" ? 1 : 2);
            const raceMatch = selectedRace === "all" || +d.CSP_RACE === {
                white: 1,
                black: 2,
                hispanic: 3,
                other: 4
            }[selectedRace];
            return genderMatch && raceMatch;
        });

        vis.updateVis();
    }

    updateVis() {
        const vis = this;

        // Generate histogram data
        const bins = d3.bin()
            .value(d => +d.PAMTOOP)
            .thresholds(20)(vis.filteredData);

        vis.xScale.domain([0, d3.max(vis.filteredData, d => +d.PAMTOOP)]);
        vis.yScale.domain([0, d3.max(bins, d => d.length)]);

        // JOIN: Bind data to rectangles
        const bars = vis.svg.selectAll(".bar").data(bins);

        // ENTER
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => vis.xScale(d.x0))
            .attr("y", vis.height) // Start at the bottom of the chart
            .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
            .attr("height", 0) // Start with zero height
            .style("fill", "#69b3a2")
            .on("mouseover", (event, d) => {
                vis.tooltip.transition().duration(200).style("opacity", 1);
                vis.tooltip.html(`
                    <strong>Range:</strong> ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)}<br>
                    <strong>Frequency:</strong> ${d.length}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mousemove", (event) => {
                vis.tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => {
                vis.tooltip.transition().duration(200).style("opacity", 0);
            })
            .merge(bars) // ENTER + UPDATE
            .transition()
            .duration(1000)
            .attr("x", d => vis.xScale(d.x0))
            .attr("y", d => vis.yScale(d.length))
            .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
            .attr("height", d => vis.height - vis.yScale(d.length));

        // EXIT
        bars.exit()
            .transition()
            .duration(1000)
            .attr("y", vis.height)
            .attr("height", 0)
            .remove();

        // Update axes
        vis.xAxis.transition().duration(1000).call(d3.axisBottom(vis.xScale));
        vis.yAxis.transition().duration(1000).call(d3.axisLeft(vis.yScale));
    }

    resizeVis() {
        const vis = this;

        // Update dimensions
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = vis.width * 0.5 - vis.margin.top - vis.margin.bottom;

        // Update SVG dimensions
        d3.select(`#${vis.parentElement} svg`)
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        // Update scales
        vis.xScale.range([0, vis.width]);
        vis.yScale.range([vis.height, 0]);

        // Update axes and visualization
        vis.updateVis();
    }
}
