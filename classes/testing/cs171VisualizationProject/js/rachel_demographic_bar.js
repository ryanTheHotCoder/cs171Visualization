class Rachel_Demographic_Bar {
    constructor(parent_element, bar_graph_data, demographic_variable) {
        // define variables
        this.parent_element = parent_element;
        this.original_data = bar_graph_data;
        this.demographic_variable = demographic_variable;

        // set title and groups
        if (this.demographic_variable == "medicare_reason") {
            this.selected_title = "Eligibility Reason"
            this.groups = ["Aged", "Disabled"]
            this.fill = "#F7ACCF"
        } else if (this.demographic_variable == "age") {
            this.selected_title = "Age"
            this.groups = ["<65", "65-74", "75+"]
            this.fill = "#FAC748"
        } else if (this.demographic_variable == "sex") {
            this.selected_title = "Sex"
            this.groups = ["Female", "Male"]
            this.fill = "#9FD356"
        } else if (this.demographic_variable == "race") {
            this.selected_title = "Race"
            this.groups = ["Black", "White", "Hispanic", "Other"]
            this.fill = "#99B2DD"
        }

        // call initVis()
        this.initVis()
    }

    initVis() {

        // initialize svg
        this.margin = {top: 50, right: 10, bottom: 30, left: 10},
            this.width = document.getElementById(this.parent_element).getBoundingClientRect().width - this.margin.left - this.margin.right,
            this.height =  document.getElementById(this.parent_element).getBoundingClientRect().width*0.8 - this.margin.top - this.margin.bottom

        this.svg = d3.select("#" + this.parent_element)
            .style("display", "flex")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // initialize graph title
        this.graph_title = this.svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.width/2)
            .attr("y", -30)
            .attr("font-family", "sans-serif")
            .attr("font-size", "15px")
            .attr("fill", "black")
            .text("")

        // initialize and generate x axis
        this.x = d3.scaleBand()
            .range([0, this.width - this.margin.left - this.margin.right])
            .padding([0.2])

        this.x_axis = this.svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")

        // initialize and generate y axis
        this.y = d3.scaleLinear()
            .range([this.height, 0])

        // initialize tooltip
        this.bar_tooltip = d3.select("body")
            .append('div')
            .attr('class', "tooltip")
            .attr('id', 'bar_tooltip');

        // this.y_axis = this.svg.append("g")

        // initialize y axis text
        // this.svg.append("text")
        //     .attr("class", "y label")
        //     .attr("text-anchor", "middle")
        //     .attr("y", -50)
        //     .attr("x", -this.height/2)
        //     .attr("transform", "rotate(-90)")
        //     .text("Number of Beneficiaries")
        //     .attr("font-family", "sans-serif")
        //     .attr("font-size", "15px")
        //     .attr("fill", "black");

        // call wrangleData()
        this.wrangleData()
    }

    wrangleData() {

        // group data by selected category
        this.grouped_data = d3.group(
            this.original_data.filter(d => d[this.demographic_variable] !== ""),
            d => d[this.demographic_variable]
        );

        // initialize storage for total numbers data
        this.data = this.groups.map(group => ({
            group: group,
            total: this.grouped_data.get(group).length
        }));

        // console.log(this.data)

        // call updateVis()
        this.updateVis()
    }

    updateVis() {
        // call axes
        this.x
            .domain(this.groups)

        this.y
            .domain([0, d3.max(this.data, d => d.total)])

        this.x_axis
            .call(d3.axisBottom(this.x))
            .selectAll("text")
            .attr("font-size", "12px");

        // this.y_axis
        //     .call(d3.axisLeft(this.y))
        //    .selectAll("text")
        //    .attr("font-size", "12px")

        // make graph title
        this.graph_title
            .text(this.selected_title)

        // make bar graph groups
        this.bars = this.svg
            .selectAll("rect")
            .data(this.data, d => d.group);

        // remove old groups
        this.bars
            .exit()
            .remove();

        // enter new bars
        this.bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => this.x(d.group))
            .attr("y", this.height)
            .attr("width", this.x.bandwidth())
            .attr("height", 0)
            .merge(this.bars)
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget)
                    .style("fill", "#AC3931")
                    .attr("stroke-width", 2);

                this.bar_tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + "px")
                    .html(`<div style="border: solid black 1px; border-radius: 2px; background: white; padding: 5px; font-size: 12px">
                         <div> Click to color the map</div> 
                         <div> by ${this.selected_title}: ${d.group}</div> 
                     </div>`);
            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget)
                    .style("fill", this.fill)
                    .attr("stroke-width", 1);

                this.bar_tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
            .on('click', (event, d) => {
                console.log(d.group)
                demographic_map.wrangleData(d.group)
            })
            .transition()
            .duration(1000)
            .attr("x", d => this.x(d.group))
            .attr("y", d => this.y(d.total))
            .attr("width", this.x.bandwidth())
            .attr("height", d => this.height - this.y(d.total))
            .attr("fill", this.fill)
            .attr("stroke", "black");

        // make bar graph labels
        this.labels = this.svg
            .selectAll(".n_label")
            .data(this.data, d => d.group);

        // remove old groups
        this.labels
            .exit()
            .remove();

        // enter new bars
        this.labels.enter()
            .append("text")
            .attr("class", "n_label")
            .attr("x", d => this.x(d.group) + this.x.bandwidth()/2)
            .attr("y", 0)
            .merge(this.labels)
            .transition()
            .duration(1000)
            .attr("x", d => this.x(d.group) + this.x.bandwidth()/2)
            .attr("y", d => this.y(d.total) - 5)
            .attr("fill", "black")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return "n=" + d.total;
            });

    }
}
