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

const educationData = await getData(urlEducationData);
const test = await getEducationData();
const geoData = await getData(urlGeoData);
const countiesGeoJson = topojson.feature(geoData, geoData.objects.counties);
const valueArray = d3.map(educationData, (d) => d.bachelorsOrHigher);
const minValue = d3.min(educationData, (d) => d.bachelorsOrHigher);
const maxValue = d3.max(educationData, (d) => d.bachelorsOrHigher);
const stepCount = 7;

async function getEducationData() {
  const rawData = await getData(urlEducationData);
  const eduDataObj = {};
  rawData.forEach((d) => (eduDataObj[d.fips] = d));
  return eduDataObj;
}

console.log(countiesGeoJson.features);
console.log(test);
console.log(valueArray);

const legendTickValues = getLegendTickValues(stepCount + 1);
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

// text-variables
const title = `United States Educational Attainment`;
const description = ` Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)
    3%`;

const colorScale = d3
  .scaleQuantize()
  .domain([minValue, maxValue])
  .range(d3.schemeGreens[7]);

// layout-variables
const width = 1000;
const height = 650;
const xPadding = 100;
const yPadding = 30;

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
      `<p>${test[d.id].area_name}, ${test[d.id].state}: ${
        test[d.id].bachelorsOrHigher
      }%</p>`
    )
    .attr("data-education", test[d.id].bachelorsOrHigher)
    .style("left", a + 50 + "px")
    .style("top", b + 50 + "px");
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
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .attr("id", "legend");

const legendXScale = d3
  .scaleLinear()
  .domain(d3.extent(legendTickValues))
  .range([10, legendWidth - 10]);

const legendXAxis = d3
  .axisBottom(legendXScale)
  .tickValues(legendTickValues)
  .tickFormat((d) => d + "%")
  .tickSize(15);

legend
  .append("g")
  //   .attr("transform", `translate(0, ${legendRect})`)
  .attr("id", "legend-x-axis")
  .call(legendXAxis);

legend
  .selectAll("rect")
  .data(legendTickValues.slice(0, legendTickValues.length - 1))
  .enter()
  .append("rect")
  .attr("x", (d, i) => legendXScale(d) + 1)
  .attr("y", 0)
  .attr("width", (d, i) => legendRect - 1)
  .attr("height", (d, i) => legendRect / 3)
  .attr("fill", (d, i) => colorScale(d));

// svg-map
svg
  .append("g")
  .selectAll("path")
  .data(countiesGeoJson.features)
  .enter()
  .append("path")
  .attr("d", d3.geoPath())
  .attr("data-fips", (d) => d.id)
  .attr("data-education", (d) => {
    return test[d.id].bachelorsOrHigher;
  })
  .attr("fill", (d) => colorScale(test[d.id].bachelorsOrHigher))
  .attr("class", "county")
  .on("mousemove", mousemove)
  .on("mouseleave", mouseleave)
  .on("mouseenter", mouseenter);

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
