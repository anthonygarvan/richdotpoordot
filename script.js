$(function() {
  var min_productivity = 1;
  var max_productivity = 5;
  var gridSize = {x: 10, y: 10}
  var squareLength = 600 / gridSize.x;
  var circleRadius = 2;

  function getSvgSize(gridSize, squareLength) {
    var width = gridSize.x * squareLength;
    var height = gridSize.y * squareLength;
    return { width:width, height:height };
  }

  function buildMap(gridSize, ratios) {
    var map = { grid:[], cells: [] };
    for (x = 0; x < gridSize.x; x++) {
        map.grid[x] = [];
        for (y = 0; y < gridSize.y; y++) {
            var type = "grass";
            var cell = { x:x, y:y , 
                        productivity: max_productivity*(Math.random()+min_productivity),
                        population: 2 };
            map.grid[x][y] = cell;
            map.cells.push(cell);
        }
    }
    return map;
  }

  function getScale(gridSize, svgSize) {
    var xScale = d3.scale.linear().domain([0,gridSize.x]).range([0,svgSize.width]);
    var yScale = d3.scale.linear().domain([0,gridSize.y]).range([0,svgSize.height]);
    return { x:xScale, y:yScale };
  }

  function drawCells(svgContainer, scales, data) {
    var gridGroup = svgContainer.append("g");
    var cells = gridGroup.selectAll("rect")
                .data(data)
                .enter()
                .append("rect");
    var cellAttributes = cells
             .attr("x", function (d) { return scales.x(d.x); })
             .attr("y", function (d) { return scales.y(d.y); })
             .attr("width", function (d) { return squareLength; })
             .attr("height", function (d) { return squareLength; })
             .attr("fill", function(d) { return 'rgb(100,' + Math.round(20*d.productivity) + ',100)'});
  }

  function drawAgents(groups, scales) {
    var agents = [];
    map.cells.forEach(function(cell) {
      Array.prototype.push.apply(agents, 
        Array.apply(null, Array(cell.population)).map(function() {return cell}))
    })
    var circleData = groups.position.selectAll("circle").data(agents);
    circleData.exit().remove();
    var circles = circleData.enter().append("circle");
    var circleAttributes = circles
             .attr("cx", function (d) { return scales.x(d.x + Math.random()); })
             .attr("cy", function (d) { return scales.y(d.y + Math.random()); })
             .attr("r", function (d) { return circleRadius; })
             .attr("class", "position");     
  }

  function executeCommands(e) {
    var current = start;
    for(i = 0; i < content.length; i++) {
      var next = getNext(map, current, content[i]);
      switch(next.type) {
        case "grass":
          path.push(next);
          current = next;
          break;
        case "rock":
          // stay at the same place
          break;
        case "lava":
          drawAgents(groups, scales);
          alert("The mower turned into ashes, as predicted.", "Start again.");
          $('#commands').val("");
          drawAgents(groups, scales);
          return;
        default:
          throw "Unexpected terrain type "+next.type;
      }
    }
    drawAgents(groups, scales);
  }

  var svgSize = getSvgSize(gridSize, squareLength);
  var map = buildMap(gridSize);

  var svgContainer = d3.select(".display")
                          .append("svg")
                            .attr("width", svgSize.width)
                            .attr("height", svgSize.height);
  var scales = getScale(gridSize, svgSize);

  drawCells(svgContainer, scales, map.cells);

  var groups = { path:svgContainer.append("g"),
                  position:svgContainer.append("g") };

  $('#commands').on('input', executeCommands);

  drawAgents(groups, scales);

  $('#commands').focus();
  
});