$(function() {
  var max_productivity = 5;
  var gridSize = {x: 10, y: 10}

  var squareLength;
  if(window.outerWidth > 640) {
   squareLength = window.outerWidth / (2.3*gridSize.x);
  } else {
    squareLength = window.outerWidth / (1.15*gridSize.x);
  }

  var maxIterations = 500;
  var reproductionCoefficient = .05; // 0.05 - adjustable
  var patronReturn = 0.8; // 0.3 - adjustable
  var mortalityCoefficient = .01; // 0.05
  var defenseCost = .1; // 0.1
  var mutationRate = 0.01; // 0.01
  var costOfLaborToClient = 0.2; // 0.2
  var clientCostForPatron = (patronReturn + costOfLaborToClient) / 2;
  var agents = [];
  var livingAgents = [];
  var year;
  var loop;
  var chartMode = 'averageIncome';
  var world;
  var map;
  var scales;

  /**********************************************
  ************ Simulation Functions *************
  **********************************************/

  function initializeAgents() {
    map.cells.forEach(function(cell) {
        var agent = {x: cell.x, y: cell.y, type: 'dove'}
        agent.income = map.grid[agent.x][agent.y].productivity; 
        agents.push(agent); 
        livingAgents.push(agent);
        cell.agents = [agent];   
        cell.population = 1;  
    })
  }

  function executeTimestep() {
    var newAgents = []

    livingAgents = livingAgents.filter(function(a) { return !a.isDead });
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
      if(!agent.isDead) {
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

      if(Math.random() < mutationRate) {
          var types = ['dove', 'solo', 'client', 'patron'];
          var candidateType = types[Math.floor(types.length * Math.random())]
          var isTerritorial = (candidateType === 'solo' || candidateType === 'patron');
          var isValid = !isTerritorial || ((cell.productivity - cell.population) >= (1 + defenseCost)) 
          if(isValid) {
            agent.type = candidateType;
            agent.isTerritorial = isTerritorial;
            
            if(agent.isTerritorial) {
              takeTerritory(agent);
            }
          }
      } 

      var reproductionRate = agent.income * reproductionCoefficient;
      if(Math.random() < reproductionRate) {
        var newAgent = JSON.parse(JSON.stringify(agent));

        var results;
        if(newAgent.isTerritorial) {
           results = map.cells.filter(function(c) {
            return !c.isDefended && ((c.productivity - c.population) >= (1 + defenseCost))
          });
        } else {
          results = map.cells.filter(function(c) {
            return !c.isDefended && ((c.productivity - c.population) >= 1)
          });
        }

        if(results.length > 0) {
          var newCell = results[Math.floor(results.length*Math.random())]; 
          newAgent.x = newCell.x;
          newAgent.y = newCell.y;
          newCell.population += 1;
          newAgents.push(newAgent);
          livingAgents.push(newAgent);
          newCell.agents.push(newAgent);
          if(newAgent.isTerritorial) {
            takeTerritory(newAgent);
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
      }
    })
    Array.prototype.push.apply(agents, newAgents);
    drawChart();
    drawAgents();
    year += 1;
    if(year >= maxIterations) {
      clearInterval(loop);
    }
    $('#year').text(year);
  }

  function takeTerritory(agent) {
    var victims = map.grid[agent.x][agent.y].agents.filter(function(a) {
          return (!a.isDead && a !== agent)});
    
    victims.forEach(function(victim) {
          victim.isDead = true;
          map.grid[agent.x][agent.y].population -= 1;
    });
    map.grid[agent.x][agent.y].isDefended = true;
  }

  function startSimulation() {
    agents = [];
    livingAgents = [];
    initializeAgents();
    year = 0;
    if(loop) {clearInterval(loop);}
    loop = setInterval(executeTimestep, 80);    
  }

  /**********************************************
  ************** Graphics Functions *************
  **********************************************/

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

  function initializeGraphics() {
    var svgSize = getSvgSize(gridSize, squareLength);
    map = buildMap(gridSize);

    var svgContainer = d3.select(".display")
                            .append("svg")
                              .attr("width", svgSize.width)
                              .attr("height", svgSize.height);
    scales = getScale(gridSize, svgSize);
    world = svgContainer.append("g");

    drawAgents();
    drawCells(svgContainer);
  }

  function getScale(gridSize, svgSize) {
    var xScale = d3.scale.linear().domain([0,gridSize.x]).range([0,svgSize.width]);
    var yScale = d3.scale.linear().domain([0,gridSize.y]).range([0,svgSize.height]);
    return { x:xScale, y:yScale };
  }

  function drawCells(svgContainer) {
    var cells = world.selectAll("rect")
                .data(map.cells)
                .enter()
                .append("rect");
    var cellAttributes = cells
             .attr("x", function (d) { return scales.x(d.x); })
             .attr("y", function (d) { return scales.y(d.y); })
             .attr("width", function (d) { return squareLength; })
             .attr("height", function (d) { return squareLength; })
             .attr("fill", function(d) { return 'rgb(50,' + Math.round(30*d.productivity) + ',50)'});
  }

  function drawAgents() {
    var circleData = world.selectAll("circle").data(agents);
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
                if(d.isDead) {return 'dead'}
                else {return d.type}})
             .attr("r", function (d) { return 2*Math.round(Math.sqrt(d.income)); });
  }

  function initializeChart() {
    var width
    if(window.outerWidth > 640) {
      width = window.outerWidth/2.3;
    } else {
      width = window.outerWidth/1.15;
    }
    chartHeight = 160;
    y = d3.scale.linear()
        .range([chartHeight, 0]);
        
    var data = [{type: 'dove', income: 0}, 
                {type: 'client', income: 0},
                {type: 'solo', income: 0}, 
                {type: 'patron', income: 0}]
                
    var chart = d3.select(".chart")
        .attr("width", width)
        .attr("height", chartHeight);

      var barWidth = width / data.length;

      var bar = chart.selectAll("g")
                      .data(data)
          bar.exit().remove();
          bar.enter().append("g")
          .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });

      bar.append("rect")
          .attr("width", barWidth - 1)
          .attr("opacity", "0.3")
          .attr("class", function(d) {return d.type});

      bar.append("text")
          .attr("x", (barWidth / 2)-20)
          .attr("y", chartHeight - 20)
          .attr("dy", ".75em")
          .text(function(d) { return d.type; });
  }

  function drawChart() {
      var incomeCounts = {'dove': 0, 'solo': 0, 'client': 0, 'patron': 0};
       var headCounts = {'dove': 0, 'solo': 0, 'client': 0, 'patron': 0};
      livingAgents.forEach(function(agent) {
        incomeCounts[agent.type] += agent.income; 
        headCounts[agent.type] += 1;     
      });

      var chartData = [];
      ['dove', 'client', 'solo', 'patron'].forEach(function(type) {
        chartData.push({type: type, income: incomeCounts[type], count: headCounts[type]})
      })

      if(chartMode === 'averageIncome') {
        y.domain([0, 20]);
        d3.select(".chart").selectAll("rect").data(chartData)
          .attr("height", function(d) { if(d.count > 0) {return chartHeight - y(d.income / d.count); } else {return 0}})
          .attr("y", function(d) {if(d.count > 0) { return y(d.income / d.count);} else {return 0; }})
          .attr("class", function(d) {return d.type});
      } else {
        y.domain([0, 500]);
        d3.select(".chart").selectAll("rect").data(chartData)
          .attr("height", function(d) { return chartHeight - y(d.count); })
          .attr("y", function(d) { return y(d.count); })
          .attr("class", function(d) {return d.type});
      }
  }

  /**********************************************
  ************** Binding to DOM *****************
  **********************************************/

  function bindEvents() {
    $("#reproductionRate").slider({min: .01, max: 0.1, value: reproductionCoefficient, step: 0.005,
                                    slide: function( event, ui ) {
                                            $("#reproductionRateDisplay").html( ui.value );
                                            reproductionCoefficient = $("#reproductionRate").slider("value");
                                            }});

    $("#profitability").slider({min: 0, max: 1.2, value: patronReturn, step: 0.05,
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

    $("#toTotalPopulation").click(function(event) {
        chartMode = 'totalPopulation';
        $('#averageIncome').hide();
        $('#totalPopulation').show();
        drawChart();
    });

    $("#toAverageIncome").click(function(event) {
        chartMode = 'averageIncome';
        $('#averageIncome').show();
        $('#totalPopulation').hide();
        drawChart();
    });

    $("#toRichDotPoorDot").click(function (){
                  $('html, body').animate({
                      scrollTop: $("#richdotpoordot").offset().top
                  }, 1000);
    });
  }


  /**********************************************
  ************* Starting Everything *************
  **********************************************/

  bindEvents();
  initializeGraphics();
  initializeChart();
  startSimulation();
});