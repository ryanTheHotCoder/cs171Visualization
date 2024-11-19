class Rachel_Grouped_Bar {
    constructor(parent_element, bar_graph_data, buttons) {
        // define variables
        this.parent_element = parent_element;
        this.original_data = bar_graph_data;
        this.colors = ["#3C1742","#476A6F","#7D4600", "#C97B84"]
        this.buttons = buttons

        // call initVis()
        this.initVis()
    }

    initVis() {

        // initialize svg
        this.margin = {top: 100, right: 30, bottom: 150, left: 0},
            this.width = document.getElementById(this.parent_element).getBoundingClientRect().width - this.margin.left - this.margin.right,
            this.height =  document.getElementById(this.parent_element).getBoundingClientRect().width*0.5 - this.margin.top - this.margin.bottom

        this.svg = d3.select("#" + this.parent_element)
            .style("display", "flex")
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // initialize color scale
        this.color_scale = d3.scaleOrdinal()
            .domain(this.buttons.bar_buttons)
            .range(this.colors)

        // initialize graph title
        this.graph_title = this.svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.width/2)
            .attr("y", -10)
            .attr("font-family", "sans-serif")
            .attr("font-size", "20px")
            .attr("fill", "black")
            .text("")

        // initialize percent trouble paying bills text
        this.percent_trouble_paying_bills_top = this.svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.width/2)
            .attr("y", this.height + 60)
            .attr("font-family", "sans-serif")
            .attr("font-size", "30px")
            .attr("fill", "black")

        this.percent_trouble_paying_bills_bottom1 = this.svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.width/2)
            .attr("y", this.height + 85)
            .attr("font-family", "sans-serif")
            .attr("font-size", "18px")
            .attr("fill", "black")
            .text("Click on a bar to learn what percent of these beneficiaries have trouble paying their medical bills.")

        this.percent_trouble_paying_bills_bottom2 = this.svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("x", this.width/2)
            .attr("y", this.height + 105)
            .attr("font-family", "sans-serif")
            .attr("font-size", "18px")
            .attr("fill", "black")
            .text("")


        // initialize and generate x axis
        this.x = d3.scaleBand()
            .range([0, this.width - this.margin.left - this.margin.right])
            .padding([0.2])

        this.x_subgroups = d3.scaleBand()
            .domain(this.buttons.bar_buttons)
            .padding([0.1])

        this.x_axis = this.svg.append("g")
            .attr("transform", "translate(0," + this.height + ")")

        // initialize and generate y axis
        this.y = d3.scaleLinear()
            .domain([0, 100])
            .range([this.height, 0])

        this.y_axis = this.svg.append("g")

        // initialize y axis text
        this.svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("y", -30)
            .attr("x", -this.height/2)
            .attr("transform", "rotate(-90)")
            .text("% of Beneficiaries")
            .attr("font-family", "sans-serif")
            .attr("font-size", "15px")
            .attr("fill", "black");

        // call wrangleData()
        this.wrangleData(this.buttons)
    }

    wrangleData(buttons) {

        // clear text whenever graph is updated
        this.percent_trouble_paying_bills_top
            .text("")

        this.percent_trouble_paying_bills_bottom1
            .text("Click on a bar to learn what percent of these beneficiaries have trouble paying their medical bills.")

        this.percent_trouble_paying_bills_bottom2
            .text("")

        // console.log(buttons)
        this.selected_category = buttons.demographic_button[0]
        this.subgroups = buttons.bar_buttons
        // console.log(this.selected_category)
        // console.log(this.subgroups)

        // set for now; this will update with a button eventually
        if (this.selected_category == "medicare_reason") {
            this.selected_title = "Eligibility Reason"
            this.groups = ["Aged", "Disabled"]
        } else if (this.selected_category == "age") {
            this.selected_title = "Age"
            this.groups = ["<65", "65-74", "75+"]
        } else if (this.selected_category == "sex") {
            this.selected_title = "Sex"
            this.groups = ["Female", "Male"]
        } else if (this.selected_category == "race") {
            this.selected_title = "Race"
            this.groups = ["Black", "White", "Hispanic", "Other"]
        } if (this.selected_category == "mental_illness") {
            this.selected_title = "Mental Illness Status"
            this.groups = ["Yes", "No"]
        }

        // group data by selected category
        this.grouped_data = d3.group(
            this.original_data.filter(d => d[this.selected_category] !== ""),
            d => d[this.selected_category]
        );

        console.log(this.original_data)

        // initialize storage for summed data
        this.compiled_data = {};
        this.groups.forEach(group => {
            this.compiled_data[group] = {
                total: this.grouped_data.get(group).length,
                medicaid_num: 0,
                medicare_advantage_num: 0,
                part_d_num: 0,
                private_insurance_num: 0,
                problem_paying_bills_num: 0};
        });

        // sum up number of beneficiaries per category across supplemental insurance subtypes
        this.grouped_data.forEach((array, group) => {
            array.forEach(row => {
                this.compiled_data[group].medicaid_num += +row.medicaid;
                this.compiled_data[group].medicare_advantage_num += +row.medicare_advantage;
                this.compiled_data[group].part_d_num += +row.part_d;
                this.compiled_data[group].private_insurance_num += +row.private_insurance;
                this.compiled_data[group].problem_paying_bills_num += +row.problem_paying_bills;
            });
        })

        // based on these totals, calculate percent of beneficiaries with each type of insurance
        this.groups.forEach(group => {
            this.compiled_data[group].medicaid_pct = Math.round(100*this.compiled_data[group].medicaid_num/this.compiled_data[group].total);
            this.compiled_data[group].medicare_advantage_pct = Math.round(100*this.compiled_data[group].medicare_advantage_num/this.compiled_data[group].total);
            this.compiled_data[group].part_d_pct = Math.round(100*this.compiled_data[group].part_d_num/this.compiled_data[group].total);
            this.compiled_data[group].private_insurance_pct = Math.round(100*this.compiled_data[group].private_insurance_num/this.compiled_data[group].total);
            this.compiled_data[group].problem_paying_bills_pct = Math.round(100*this.compiled_data[group].problem_paying_bills_num/this.compiled_data[group].total);
        });

        console.log(this.compiled_data)
        // convert data into structure for d3 plotting
        this.data_for_graph = Object.keys(this.compiled_data).map(group => {
            return this.subgroups.map(subgroup => ({
                group: group,
                subgroup: subgroup,
                value: this.compiled_data[group][`${subgroup}_pct`],
                num_value: this.compiled_data[group][`${subgroup}_num`]

            }));
        }).flat();

        // console.log(this.data_for_graph)
        this.filtered_data_for_graph = this.data_for_graph.filter(({subgroup}) => this.subgroups.includes(subgroup))

        // call updateVis()
        // this.filterDataForPercents(this.selected_category)
        this.updateVis()
    }


    updateVis() {
        // call axes
        this.x
            .domain(this.groups)

        this.x_subgroups
            .range([0, this.x.bandwidth()])

        this.x_axis
            .call(d3.axisBottom(this.x))
            .selectAll("text")
            .attr("font-size", "15px");

        this.y_axis
            .call(d3.axisLeft(this.y))
            .selectAll("text")
            .attr("font-size", "12px")

        // make graph title
        this.graph_title
            .text("% of Beneficiaries by " + this.selected_title)

        // make bar graph groups
        const groups = this.svg
            .selectAll(".group")
            .data(this.filtered_data_for_graph, d => d.group);

        // remove old groups
        groups.exit().remove();

        // enter groups
        const enter_groups = groups
            .enter()
            .append("g")
            .attr("class", "group")
            .attr("transform", d => `translate(${this.x(d.group)}, 0)`);

        // merge groups
        const merge_groups = enter_groups
            .merge(groups);

        // initialize bars on top of the new groups
        const bars = merge_groups
            .selectAll("rect")
            .data(d => this.subgroups.map(category => ({
                group: d.group,
                subgroup: category,
                value: this.compiled_data[d.group][`${category}_pct`]
            })), d => d.key);

        // remove old bars
        bars
            .exit()
            .remove();

        // enter new bars
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => this.x_subgroups(d.subgroup))
            .attr("y", this.height)
            .attr("width", this.x_subgroups.bandwidth())
            .attr("height", 0)
            .merge(bars)
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget)
                    .style("fill", "#AC3931")
                    .attr("stroke-width", 2);

            })
            .on('mouseout', (event, d) => {
                d3.select(event.currentTarget)
                    .style("fill", this.fill)
                    .attr("stroke-width", 1);

            })
            .on('click', (event, d) => {
                console.log(d.group)

                this.filterDataForPercents(this.selected_category, d.group, d.subgroup)

            })
            .transition()
            .duration(1000)
            .attr("x", d => this.x_subgroups(d.subgroup))
            .attr("y", d => this.y(d.value))
            .attr("width", this.x_subgroups.bandwidth())
            .attr("height", d => this.height - this.y(d.value))
            .attr("fill", d => this.color_scale(d.subgroup))
            .attr("stroke", "black");

        // initialize n labels on top of the new groups
        const n_labels = merge_groups
            .selectAll(".n_label")
            .data(d => this.subgroups.map(category => ({
                key: category,
                value: this.compiled_data[d.group][`${category}_pct`],
                num_value: this.compiled_data[d.group][`${category}_num`]
            })), d => d.key);

        // remove old labels
        n_labels
            .exit()
            .remove();

        // enter new labels
        n_labels.enter()
            .append("text")
            .attr("class", "n_label")
            .merge(n_labels)
            .attr("x", d => this.x_subgroups(d.key) + this.x_subgroups.bandwidth()/2)
            .attr("y", this.height)
            .transition()
            .duration(1000)
            .attr("x", d => this.x_subgroups(d.key) + this.x_subgroups.bandwidth()/2)
            .attr("y", d => this.y(d.value) - 5)
            .attr("fill", "black")
            .attr("font-size", "12px")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return "n=" + d.num_value;
            });

        // initialize pct labels on top of the new groups
        const pct_labels = merge_groups
            .selectAll(".pct_label")
            .data(d => this.subgroups.map(category => ({
                key: category,
                value: this.compiled_data[d.group][`${category}_pct`]})), d => d.key);

        // remove old labels
        pct_labels
            .exit()
            .remove();

        // enter new labels
        pct_labels.enter()
            .append("text")
            .attr("class", "pct_label")
            .merge(pct_labels)
            .attr("x", d => this.x_subgroups(d.key) + this.x_subgroups.bandwidth()/2)
            .attr("y", this.height)
            .transition()
            .duration(1000)
            .attr("x", d => this.x_subgroups(d.key) + this.x_subgroups.bandwidth()/2)
            .attr("y", d => this.y(d.value) - 20)
            .attr("fill", "black")
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .text(function(d) {
                return d.value + "%";
            });

    }

    filterDataForPercents(demographic_category, group, subgroup) {
        // filter dataset for only relevant bar
        this.filtered_data_for_percents = this.original_data.filter(
            row => row[demographic_category] === group && row[subgroup] === "1"
        )

        // initialize storage for summed data
        this.filtered_compiled_data_for_percents = {total: 0, problem_paying_bills_num: 0, problem_paying_bills_pct: 0};
        this.filtered_data_for_percents.forEach(row => {
            this.filtered_compiled_data_for_percents.total = this.filtered_data_for_percents.length;
            this.filtered_compiled_data_for_percents.problem_paying_bills_num += +row.problem_paying_bills
        });

        // calculate percent of beneficiaries with trouble paying medical bills
        this.filtered_compiled_data_for_percents.problem_paying_bills_pct = Math.round(100*this.filtered_compiled_data_for_percents.problem_paying_bills_num/this.filtered_compiled_data_for_percents.total)

        // update top text
        this.percent_trouble_paying_bills_top
            .text(this.filtered_compiled_data_for_percents.problem_paying_bills_pct + "%")

        // clean group name
        switch (group) {
            case "Aged":
                this.cleaned_group = "eligible for Medicare due to age";
                break;
            case "Disabled":
                this.cleaned_group = "eligible for Medicare due to disability";
                break;
            case "Unknown":
                this.cleaned_group = "eligible for Medicare not due to age or disability";
                break;
            case "<65":
                this.cleaned_group = "less than 65 years old";
                break;
            case "65-74":
                this.cleaned_group = "between 65 and 74 years old";
                break;
            case "75+":
                this.cleaned_group = "more than 74 years old";
                break;
            case "Female":
                this.cleaned_group = "female";
                break;
            case "Male":
                this.cleaned_group = "male";
                break;
            case "Black":
                this.cleaned_group = "Black";
                break;
            case "White":
                this.cleaned_group = "white";
                break;
            case "Hispanic":
                this.cleaned_group = "Hispanic";
                break;
            case "Other":
                this.cleaned_group = "of other race";
                break;
        }

        // clean subgroup name
        switch (subgroup) {
            case "medicaid":
                this.cleaned_subgroup = "Medicaid";
                break;
            case "medicare_advantage":
                this.cleaned_subgroup = "Medicare Advantage";
                break;
            case "part_d":
                this.cleaned_subgroup = "Part D";
                break;
            case "private_insurance":
                this.cleaned_subgroup = "private insurance";
                break;
        }

        // update bottom text
        this.percent_trouble_paying_bills_bottom1
            .text("of beneficiaries who are " + this.cleaned_group)

        this.percent_trouble_paying_bills_bottom2
            .text("with supplemental " + this.cleaned_subgroup + " have trouble paying their medical bills.")
    }

}

/*
extract group names
this.groups = Array.from(this.grouped_data.keys());


this.legend_svg = this.full_svg
    .append("svg")
    .attr("width", this.legend_width)
    .attr("height", this.height + this.margin.top + this.margin.bottom)
    .append("g")
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

// initialize legend
this.legend = this.legend_svg
    .append("g")
    .attr('class', 'legend')

// draw legend
this.legend
    .selectAll("rect")
    .data(this.colors)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i) { return 35*i + 40; })
    .attr("width", 30)
    .attr("height", 30)
    .attr("fill", d => d)
    .attr("stroke", "black");

// label legend colors
this.legend.selectAll("text")
    .data(["Medicaid", "Medicare Advantage", "Part D", "Private Insurance"])
    .enter()
    .append("text")
    .text(d => d)
    .attr("x", 32)
    .attr("y", function(d, i) { return 35*i + 60; })
    .attr("font-family", "sans-serif")
    .attr("font-size", "15px")
    .attr("fill", "black");

// title legend
this.legend.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -10)
    .attr("x", -29)
    .attr("text-anchor", "end")
    .attr("fill", "black")
    .attr("font-family", "sans-serif")
    .attr("font-size", "15px")
    .text("Supplemental Insurance");
*/
