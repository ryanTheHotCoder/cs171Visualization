class OOPScatterVis {
    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;

        this.initVis();
    }

    initVis() {
        const vis = this;

        // Define margins and initial dimensions
        vis.margin = { top: 50, right: 150, bottom: 50, left: 60 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = vis.width * 0.6 - vis.margin.top - vis.margin.bottom;

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
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(d3.format("$,.0f"));
        vis.yAxis = d3.axisLeft(vis.yScale).tickFormat(d3.format("$,.0f"));

        vis.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        vis.svg.append("g")
            .attr("class", "y-axis");

        // Axis labels
        vis.svg.append("text")
            .attr("class", "x-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .text("Total Payments ($)");

        vis.svg.append("text")
            .attr("class", "y-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .text("Out-of-Pocket Payments ($)");

        // Add a legend group at the upper right
        vis.legendGroup = vis.svg.append("g")
            .attr("class", "legendOrdinal")
            .attr("transform", `translate(${vis.width - 100}, 20)`);

        // Define legend scale
        vis.legendColorScale = d3.scaleOrdinal()
            .domain(["< $25,000", ">= $25,000"])
            .range(["#1f77b4", "#ff7f0e"]);

        // Tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Call wrangleData()
        vis.wrangleData();
    }

    wrangleData() {
        const vis = this;

        // Filter data based on the selected income level
        const selectedIncome = d3.select("#incomeFilter").property("value");

        vis.filteredData = vis.data.filter(d => {
            if (selectedIncome === "all") return true;
            if (selectedIncome === "<25000") return d.CSP_INCOME === 1; // Income < $25,000
            if (selectedIncome === ">=25000") return d.CSP_INCOME === 2; // Income >= $25,000
        });

        vis.updateVis();
    }

    updateVis() {
        const vis = this;

        // Update scales
        vis.xScale.domain([0, d3.max(vis.filteredData, d => +d.PAMTTOT)]);
        vis.yScale.domain([0, d3.max(vis.filteredData, d => +d.PAMTOOP)]);

        // JOIN: Bind data
        const circles = vis.svg.selectAll(".circle")
            .data(vis.filteredData, d => d.PUF_ID);

        // ENTER
        circles.enter()
            .append("circle")
            .attr("class", "circle")
            .attr("cx", d => vis.xScale(+d.PAMTTOT))
            .attr("cy", vis.height) // Start at the bottom
            .attr("r", 4)
            .style("fill", d => d.CSP_INCOME === 1 ? "#1f77b4" : "#ff7f0e") // Color by income
            .style("opacity", 0.7)
            .on("mouseover", (event, d) => {
                vis.tooltip.transition().duration(200).style("opacity", 1);
                vis.tooltip.html(
                    `<strong>Total Payments:</strong> $${d.PAMTTOT.toLocaleString()}<br>
                     <strong>Out-of-Pocket:</strong> $${d.PAMTOOP.toLocaleString()}`
                )
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                vis.tooltip.transition().duration(200).style("opacity", 0);
            })
            .merge(circles) // ENTER + UPDATE
            .transition()
            .duration(1000)
            .attr("cx", d => vis.xScale(+d.PAMTTOT))
            .attr("cy", d => vis.yScale(+d.PAMTOOP));

        // EXIT: Remove circles not in filtered data
        circles.exit()
            .transition()
            .duration(1000)
            .attr("cy", vis.height)
            .remove();

        // Update axes
        vis.svg.select(".x-axis").transition().duration(1000).call(vis.xAxis);
        vis.svg.select(".y-axis").transition().duration(1000).call(vis.yAxis);

        // Update legend
        const legend = d3.legendColor()
            .scale(vis.legendColorScale)
            .title("Income Group")
            .shape("circle")
            .shapeRadius(6)
            .shapePadding(10)
            .labelOffset(10);

        vis.legendGroup.call(legend);
    }

    resizeVis() {
        const vis = this;

        // Update width and height
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = vis.width * 0.6 - vis.margin.top - vis.margin.bottom;

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

