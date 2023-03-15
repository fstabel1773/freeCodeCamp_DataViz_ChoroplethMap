import * as d3 from "https://unpkg.com/d3?module";

// get data
const urlEducationData =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
const urlGeoData =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

async function getData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Not able to fetch the data. There was an error: ", error);
  }
}

function getEducationData(rawDataArray) {
  const eduDataObj = {};
  rawDataArray.forEach((d) => (eduDataObj[d.fips] = d));
  return eduDataObj;
}

function getLegendTickValues(count) {
  const step = (maxValue - minValue) / count;
  let value = minValue;
  const valueArray = [];
  while (value < maxValue) {
    valueArray.push(value);
    value += step;
  }
  return valueArray.map((value) => Math.round(value));
}

// map data
const educationDataArray = await getData(urlEducationData);
const educationDataObj = getEducationData(educationDataArray);

const geoData = await getData(urlGeoData);
const statesGeoJson = topojson.feature(geoData, geoData.objects.states);
const countiesGeoJson = topojson.feature(geoData, geoData.objects.counties);

const minValue = d3.min(educationDataArray, (d) => d.bachelorsOrHigher);
const maxValue = d3.max(educationDataArray, (d) => d.bachelorsOrHigher);
const stepCount = 7;

const legendTickValues = getLegendTickValues(stepCount + 1);

// text-variables
const title = `United States Educational Attainment`;
const description = ` Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)
    3%`;

// colorScale
const colorScale = d3
  .scaleQuantize()
  .domain([minValue, maxValue])
  .range(d3.schemeGreens[stepCount]);

// layout-variables
const width = 1000;
const height = 620;

const legendPadding = 10;
const legendWidth = width / 4;
const legendRect = (legendWidth - 20) / stepCount;
const legendHeight = legendRect * 3;

// tooltip
const tooltip = d3
  .select("body")
  .append("g")
  .attr("id", "tooltip")
  .style("opacity", 0);

const mouseenter = (event, d) => {
  tooltip.style("opacity", 0.9);
};

const mouseleave = (event, d) => {
  tooltip.transition().duration(500).style("opacity", 0);
};

const mousemove = (event, d) => {
  const [a, b] = d3.pointer(event);

  tooltip.transition().duration(200).style("opacity", 0.9);
  tooltip
    .html(
      `<p>${educationDataObj[d.id].area_name}, ${
        educationDataObj[d.id].state
      }: ${educationDataObj[d.id].bachelorsOrHigher}%</p>`
    )
    .attr("data-education", educationDataObj[d.id].bachelorsOrHigher)
    .style("left", a + "px")
    .style("top", b + 100 + "px");
};

// container
const container = d3.select("body").append("div").attr("class", "container");

// title and description
const header = container.append("div").attr("class", "header");
header.append("h1").text(title).attr("id", "title");
header.append("h4").text(description).attr("id", "description");

// svg
const svg = container.append("svg").attr("width", width).attr("height", height);

// legend
const legend = svg
  .append("svg")
  .attr("x", width - legendWidth - 160)
  .attr("y", 30)
  .attr("width", legendWidth + 2 * legendPadding)
  .attr("height", legendHeight)
  .attr("id", "legend");

const legendXScale = d3
  .scaleLinear()
  .domain(d3.extent(legendTickValues))
  .range([legendPadding, legendWidth - legendPadding]);

const legendXAxisGenerator = d3
  .axisBottom(legendXScale)
  .tickValues(legendTickValues)
  .tickFormat((d) => d + "%")
  .tickSize(20);

const legendXAxis = legend
  .append("g")
  .attr("id", "legendXAxis")
  .call(legendXAxisGenerator);

legendXAxis
  .selectAll(".tick line")
  .attr("stroke", "orange")
  .attr("stroke-width", "2");

legendXAxis
  .selectAll(".tick text")
  .attr("font-size", "12")
  .style("color", "orange");

legend
  .selectAll("rect")
  .data(legendTickValues.slice(0, legendTickValues.length - 1))
  .enter()
  .append("rect")
  .attr("x", (d, i) => legendXScale(d) + 1)
  .attr("y", 0)
  .attr("width", (d, i) => legendRect - 1)
  .attr("height", (d, i) => legendRect / 3)
  .attr("fill", (d, i) => colorScale(d))
  .attr("stroke", "orange")
  .attr("stroke-width", "2");

// svg-map
const counties = svg.append("g");
const states = svg.append("g");

counties
  .selectAll("path")
  .data(countiesGeoJson.features)
  .enter()
  .append("path")
  .attr("d", d3.geoPath())
  .attr("data-fips", (d) => d.id)
  .attr("data-education", (d) => {
    return educationDataObj[d.id].bachelorsOrHigher;
  })
  .attr("fill", (d) => colorScale(educationDataObj[d.id].bachelorsOrHigher))
  .attr("class", "county")
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  .on("mouseenter", mouseenter);

states
  .selectAll("path")
  .data(statesGeoJson.features)
  .enter()
  .append("path")
  .attr("d", d3.geoPath())
  .attr("fill", "none")
  .attr("stroke", "orange");

// Source-Link
container
  .append("p")
  .text("Source: ")
  .append("a")
  .attr(
    "href",
    "https://www.freecodecamp.org/learn/data-visualization/data-visualization-projects/visualize-data-with-a-choropleth-map"
  )
  .text("freeCodeCamp data visualization course");
