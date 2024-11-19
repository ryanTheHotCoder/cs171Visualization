// init global variables & switches
let bar_graph, demographic_map, demographic_bar;
let buttons = { demographic_button: ["medicare_reason"], bar_buttons:["medicaid", "medicare_advantage", "part_d", "private_insurance"]};
let oopDistribution;
let oopScatterVis;


// load data using promises
let promises = [
    d3.csv("data/rachel_data_cleaned.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
    d3.csv("data/rachel_map_data_cleaned.csv"),
    d3.csv("data/processed_mcbs_cost_supplement.csv")
];

Promise.all(promises)
    .then(function (data) {
        // console.log("data/rachel_data_cleaned loaded")
        console.log(data[3]);
        data[3].forEach(d => {
            d.PAMTOOP = +d.PAMTOOP; // Convert out-of-pocket costs to numeric
            d.PAMTTOT = +d.PAMTTOT; // Convert total costs to numeric
            d.CSP_AGE = +d.CSP_AGE; // Convert age to numeric
            d.CSP_RACE = +d.CSP_RACE; // Convert race to numeric
            d.CSP_SEX = +d.CSP_SEX; // Convert gender to numeric
            d.CSP_INCOME = +d.CSP_INCOME; // Convert income to numeric
        });
        initialize_graphs(data)
    })
    .catch(function (err) {
        console.log("Error loading data:", err)
    });

// initialize graphs
function initialize_graphs(data) {
    bar_graph = new Rachel_Grouped_Bar("bar_graph_div", data[0], buttons);
    demographic_map = new Rachel_Demographic_Map("demographic_map_div", data[1], data[2]);
    medicare_reason_bar = new Rachel_Demographic_Bar("medicare_reason_bar_div", data[0], "medicare_reason");
    age_bar = new Rachel_Demographic_Bar("age_bar_div", data[0], "age");
    sex_bar = new Rachel_Demographic_Bar("sex_bar_div", data[0], "sex");
    race_bar = new Rachel_Demographic_Bar("race_bar_div", data[0], "race");

    // Ryan's Out-Of-Pocket distribution
    oopDistribution = new OOPDistributionVis("oop_distribution_div", data[3]);
    oopScatterVis = new OOPScatterVis("scatter-plot", data[3]);

    d3.select("#incomeFilter").on("change", () => {
        oopScatterVis.wrangleData();
    });

    // Add resize listener to adjust graphs dynamically
    window.addEventListener("resize", () => {
        oopScatterVis.resizeVis();
        oopDistribution.resizeVis();
    });
}

// button styling
function click_demographic_button(button) {
    // activate button
    button.classList.toggle("active");

    // find list of active demographic buttons
    const active_demographic_buttons = document.querySelectorAll('.demographic_button.active');

    // if there are other buttons active, deactivate them
    for (let active_demographic_button of active_demographic_buttons) {
        if (this !== active_demographic_button) {
            active_demographic_button.classList.remove('active');
        }
    }

    // send list of active buttons to graph
    const send_active_demographic_buttons = [];
    active_demographic_buttons.forEach(button => {
        send_active_demographic_buttons.push(button.id)
    })
    // console.log(send_active_demographic_buttons)
    buttons.demographic_button = send_active_demographic_buttons
    bar_graph.wrangleData(buttons)
}


function click_bar_button(button) {
    // activate button
    button.classList.toggle("active");

    // find list of active bar buttons
    const active_bar_buttons = document.querySelectorAll('.bar_button.active');

    // send list of active buttons to graph
    const send_active_bar_buttons = [];
    active_bar_buttons.forEach(button => {
        send_active_bar_buttons.push(button.id)
    })
    // console.log(send_active_bar_buttons)
    buttons.bar_buttons = send_active_bar_buttons
    bar_graph.wrangleData(buttons)
}