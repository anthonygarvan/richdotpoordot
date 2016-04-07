$(function() {
  var max_productivity = 5;
  var gridSize = {x: 10, y: 10}
  var squareLength = window.innerHeight / gridSize.y;
  var maxIterations = 500;
  var reproductionCoefficient = .05; // 0.05 - adjustable
  var patronReturn = 0.8; // 0.3 - adjustable
  var mortalityCoefficient = .05; // 0.05
  var defenseCost = .1; // 0.1
  var mutationRate = 0.01; // 0.01
  var costOfLaborToClient = 0.2; // 0.2
  var clientCostForPatron = (patronReturn + costOfLaborToClient) / 2;

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
            var cell = { x:x, y:y , 
                        productivity: Math.ceil(max_productivity*Math.random()),
                        population: 0};
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
             .attr("fill", function(d) { return 'rgb(50,' + Math.round(30*d.productivity) + ',50)'});
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
                if(d.type === 'solo') {return 'red'}
                if(d.type === 'client') {return 'yellow'}
                if(d.type === 'patron') {return 'purple'}})
             .attr("r", function (d) { return 2*Math.round(Math.sqrt(d.income)); });
  }

  function takeTerritory(livingAgents, agent) {
    var victims = livingAgents.filter(function(a) {
          return (a.x === agent.x && a.y === agent.y) && a !== agent});
    
    victims.forEach(function(victim) {
          victim.isDead = true;
          map.grid[agent.x][agent.y].population -= 1;
    });
  }

  function executeTimestep() {
    var newAgents = []

    var livingAgents = agents.filter(function(a) { return !a.isDead });
    var patrons = livingAgents.filter(function(a) {return (a.type === 'patron')});
    var clients = livingAgents.filter(function(a) {return (a.type === 'client')});

    
    patrons.forEach(function(patron) {patron.clientCount = 0})
    clients.forEach(function(client) {client.patronCount = 0})
    if(patrons.length > 0) {
      clients.forEach(function(client) {
        var patron = patrons[Math.floor(patrons.length * Math.random())]
        patron.clientCount += 1
        client.patronCount = 1;        
      })      
    }

    livingAgents.forEach(function(agent) {
      var cell = map.grid[agent.x][agent.y];

      if(agent.type === 'dove') {
        agent.income = cell.productivity / cell.population;          
      }

      if(agent.type === 'solo') {
        agent.income = cell.productivity / cell.population - defenseCost;
      }

      if(agent.type === 'patron') {
        agent.income = cell.productivity + 
                      agent.clientCount*(patronReturn - clientCostForPatron) - defenseCost;
      }

      if(agent.type === 'client') {
        agent.income = (cell.productivity / cell.population) +
                          agent.patronCount*(clientCostForPatron - costOfLaborToClient);  
      }

      if(agent.isTerritorial) {
        if(cell.productivity > (1 + defenseCost)) {
          cell.isDefended = true;
        }
      }

      if(Math.random() < mutationRate) {
          var types = ['dove', 'solo', 'client', 'patron'];
          var candidateType = types[Math.floor(types.length * Math.random())]
          var isTerritorial = (candidateType === 'solo' || candidateType === 'patron');
          var isValid = !isTerritorial || 
                      (isTerritorial && ((cell.productivity - cell.population) >= (1 + defenseCost))) 
          if(isValid) {
            agent.type = candidateType;
            agent.isTerritorial = isTerritorial;
            
            if(agent.isTerritorial) {
              takeTerritory(livingAgents, agent);
            }
          }
      } 

      var reproductionRate = agent.income * reproductionCoefficient;
      if(Math.random() < reproductionRate) {
        var newAgent = JSON.parse(JSON.stringify(agent));

        var results;
        if(newAgent.isTerritorial) {
           results = map.cells.filter(function(c) {
            return !cell.isDefended && ((c.productivity - c.population) >= (1 + defenseCost))
          });
        } else {
          results = map.cells.filter(function(c) {
            return !cell.isDefended && ((c.productivity - c.population) >= 1)
          });
        }

        if(results.length > 0) {
          var newCell = results[Math.floor(results.length*Math.random())]; 
          newAgent.x = newCell.x;
          newAgent.y = newCell.y;
          newCell.isDefended = newAgent.isTerritorial;
          newCell.population += 1;
          newAgents.push(newAgent);
          if(newAgent.isTerritorial) {
            takeTerritory(livingAgents, newAgent);
          }
        }
      }

      var mortalityRate = mortalityCoefficient * (cell.productivity / agent.income);
      if(Math.random() < mortalityRate) {
        agent.isDead = true;
        cell.population -= 1;
        if(cell.population == 0) {
          cell.isDefended = false;
        }
      }
    })
    Array.prototype.push.apply(agents, newAgents);
    drawAgents(groups, scales);
    year += 1;
    if(year >= maxIterations) {
      clearInterval(loop);
    }
    $('#year').text(year);
  }

  function initializeAgents() {
    map.cells.forEach(function(cell) {
        var agent = {x: cell.x, y: cell.y, type: 'dove'}
        agent.income = map.grid[agent.x][agent.y].productivity; 
        agents.push(agent);    
        cell.population = 1;  
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

  var agents;
  var year;
  var loop;
  function startSimulation() {
    agents = [];
    initializeAgents();
    drawAgents(groups, scales);

    year = 0;
    if(loop) {clearInterval(loop);}
    loop = setInterval(executeTimestep, 80);    
  }

  $("#reproductionRate").slider({min: .01, max: 0.1, value: reproductionCoefficient, step: 0.005,
                                  slide: function( event, ui ) {
                                          $("#reproductionRateDisplay").html( ui.value );
                                          reproductionCoefficient = $("#reproductionRate").slider("value");
                                          }});

  $("#profitability").slider({min: .1, max: 1.2, value: patronReturn, step: 0.05,
                                  slide: function( event, ui ) {
                                          $("#profitabilityDisplay").html( ui.value );
                                          patronReturn = $("#profitability").slider("value");
                                          clientCostForPatron = (patronReturn + costOfLaborToClient) / 2;
                                          }});
  $("#reproductionRateDisplay").text(reproductionCoefficient);
  $("#profitabilityDisplay").text(patronReturn);

  $("#start").click(function(event) {
    event.preventDefault();
    startSimulation();
    $(this).blur();
  });

  startSimulation();
});