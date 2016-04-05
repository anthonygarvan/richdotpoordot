$(function() {
  var min_productivity = 1;
  var max_productivity = 5;
  var gridSize = {x: 10, y: 10}
  var squareLength = (window.innerHeight-20) / gridSize.y;
  var circleRadius = 2;
  var maxIterations = 500;
  var reproductionCoefficient = .025;
  var mortalityCoefficient = .01;
  var newbornMigrationProb = 0.05;
  var defenseCost = .1;
  var mutationRate = 0.0025;

  function getSvgSize(gridSize, squareLength) {
    var width = gridSize.x * squareLength;
    var height = gridSize.y * squareLength;
    return { width: width, height: height };
  }

  function buildMap(gridSize, ratios) {
    var map = { grid:[], cells: [] };
    for (x = 0; x < gridSize.x; x++) {
        map.grid[x] = [];
        for (y = 0; y < gridSize.y; y++) {
            var type = "grass";
            var cell = { x:x, y:y , 
                        productivity: (max_productivity - min_productivity)*(Math.random() + min_productivity),
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
              });
    circleData
             .attr("class", function(d) {
                if(d.isDead) {return 'black'}
                if(d.type === 'dove') {return 'blue'}
                if(d.type === 'solo') {return 'red'}})
             .attr("r", function (d) { return 2*Math.round(d.income); });
  }

  function executeTimestep() {
    var newAgents = []

    agents.filter(function(a) { return !a.isDead }).forEach(function(agent) {
      reproductionRate = agent.income * reproductionCoefficient;
      mortalityRate = mortalityCoefficient / agent.income;
      agent.income = map.grid[agent.x][agent.y].productivity / map.grid[agent.x][agent.y].population;  

      if(!agent.isTerritorial) {
        agent.isTerritorial = Math.random() < mutationRate;
        if(agent.isTerritorial) {
          agent.type = 'solo'
        }
      } else {
        var baseIncome = map.grid[agent.x][agent.y].productivity / map.grid[agent.x][agent.y].population
        agent.income = baseIncome - defenseCost;
        if(map.grid[agent.x][agent.y].productivity > (1 + defenseCost)) {
          map.grid[agent.x][agent.y].isDefended = true;
        }
      }

      if(Math.random() < reproductionRate) {
        var newAgent = JSON.parse(JSON.stringify(agent));
        if(Math.random() < newbornMigrationProb) {
          newAgent.x = Math.round(gridSize.x*Math.random())  
          newAgent.y = Math.round(gridSize.y*Math.random())
        }
        if(map.grid[newAgent.x] && map.grid[newAgent.x][newAgent.y] && 
              map.grid[newAgent.x][newAgent.y].population < 
              map.grid[newAgent.x][newAgent.y].productivity &&
              !map.grid[newAgent.x][newAgent.y].isDefended) {
            newAgents.push(newAgent);
            map.grid[newAgent.x][newAgent.y].population += 1;
        }
      }
      if(Math.random() < mortalityRate || 
        (map.grid[agent.x][agent.y].isDefended && !agent.isTerritorial)) {
        agent.isDead = true;
        map.grid[agent.x][agent.y].population -= 1;
        if(map.grid[agent.x][agent.y].population === 0) {
          map.grid[agent.x][agent.y].isDefended = false;
        }
      }
    })
    Array.prototype.push.apply(agents, newAgents);
    drawAgents(groups, scales);
    if(year >= maxIterations) {
      clearInterval(loop);
    }
    year += 1;
    $('#year').text(year);
  }

  function initializeAgents() {
    map.cells.forEach(function(cell) {
        var agent = {x: cell.x, y: cell.y, type: 'dove'}
        agent.income = map.grid[agent.x][agent.y].productivity / map.grid[agent.x][agent.y].population; 
        agents.push(agent);    
        cell.population += 1;      
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

  year = 0;
  var loop = setInterval(executeTimestep, 100);
  
});