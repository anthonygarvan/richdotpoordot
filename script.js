$(function() {
  var min_productivity = 1;
  var max_productivity = 5;
  var gridSize = {x: 10, y: 10}
  var squareLength = 600 / gridSize.x;
  var circleRadius = 2;
  var maxPopulationPerCell = 20;
  var maxIterations = 100;
  var reproductionCoefficient = .025;
  var mortalityCoefficient = .01;
  var newbornMigrationProb = 0.2;

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
                        population: 4 };
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
    var circleData = groups.position.selectAll("circle").data(agents);
    circleData.exit().remove();
    circleData.enter().append("circle")
             .attr("cx", function (d) { 
                return scales.x(d.x + Math.random()); 
              })
             .attr("cy", function (d) { 
                return scales.y(d.y + Math.random()); 
              })
             .attr("r", function (d) { return circleRadius; });
    circleData
             .attr("class", function(d) {if(d.isDead) {return 'black'} else {return 'blue'}});     
  }

  function executeTimestep() {
    var newAgents = []
    agents.forEach(function(agent) {
      reproductionRate = agent.income * reproductionCoefficient;
      mortalityRate = mortalityCoefficient / agent.income;
      if(!agent.isDead && Math.random() < reproductionRate) {
        var newAgent = JSON.parse(JSON.stringify(agent));
        if(Math.random() < newbornMigrationProb) {
          newAgent.x += Math.round(2*(Math.random() - .5))  
          newAgent.y += Math.round(2*(Math.random() - .5))
        }
        if(map.grid[newAgent.x] && map.grid[newAgent.x][newAgent.y] 
          && map.grid[newAgent.x][newAgent.y].population < maxPopulationPerCell) {
            newAgents.push(newAgent);
        }
        map.grid[agent.x][agent.y].population += 1;
      }
      if(Math.random() < mortalityRate) {
        agent.isDead = true;
        map.grid[agent.x][agent.y].population -= 1
      }
    })
    Array.prototype.push.apply(agents, newAgents);
    drawAgents(groups, scales);
    if(time >= maxIterations) {
      clearInterval(loop);
    }
    time += 1;
  }

  function initializeAgents() {
    map.cells.forEach(function(cell) {
        for(var i = 0; i < Math.round(initialAgentsPerCell*Math.random()); i++) {
          agents.push({x: cell.x, y: cell.y, income: 5*Math.random()});    
          cell.population += 1;      
        }
    })
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

  var initialAgentsPerCell = 3;
  var agents = [];
  initializeAgents();
  drawAgents(groups, scales);

  time = 0;
  var loop = setInterval(executeTimestep, 100);
  
});