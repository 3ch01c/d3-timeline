/**
* @author James Wernicke
* @version 1.0
*/

d3.timeline = function(){
  var FIT_TIME_DOMAIN_MODE = "fit";
  var FIXED_TIME_DOMAIN_MODE = "fixed";

  var margin = {
    top : 20,
    right : 40,
    bottom : 20,
    left : 150
  };
  var timeDomainStart = d3.time.day.offset(new Date(),-3);
  var timeDomainEnd = d3.time.hour.offset(new Date(),+3);
  var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
  var eventTypes = [];
  var eventStatus = [];
  var height = document.body.clientHeight - margin.top - margin.bottom-5;
  var width = document.body.clientWidth - margin.right - margin.left-5;
  var tickFormat = "%H:%M";
  var tooltip = false;
  var showLabels = false;
  var container = ".timeline";
  var sortKey = "startDate";

  var keyFunction = function(d) {
    return d.startDate + d.id + d.endDate;
  };

  var rectTransform = function(d) {
    return "translate(" + x(d.startDate) + "," + y(d.id) + ")";
  };

  var x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
  var y = d3.scale.ordinal().domain(eventTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], .1);
  var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true).tickSize(8).tickPadding(8);
  var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);

  var initTimeDomain = function(events) {
    if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
      if (events === undefined || events.length < 1) {
        timeDomainStart = d3.time.day.offset(new Date(), -3);
        timeDomainEnd = d3.time.hour.offset(new Date(), +3);
        return;
      }
      events.sort(function(a, b) {
        return a.endDate - b.endDate;
      });
      timeDomainEnd = events[events.length - 1].endDate;
      events.sort(function(a, b) {
        return a.startDate - b.startDate;
      });
      timeDomainStart = events[0].startDate;
    }
  };

  var initAxis = function() {
    x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
    y = d3.scale.ordinal().domain(eventTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ]);
    xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat))
    yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);
  };

  function timeline(events) {
		initTimeDomain(events);
    initAxis();
    var chart = d3.select(container)
      .append("svg")
      .attr("class", "chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("class", "timeline-chart")
      .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    var bar = chart.selectAll(".chart")
      .data(events, keyFunction).enter()
    // add bar
    var rect = bar.append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("class", function(d){
        if(eventStatus[d.status] == null){
          return "bar";
        }
        return eventStatus[d.status];
      })
      .attr("y", 0)
      .attr("transform", rectTransform)
      .attr("height", function(d) { return y.rangeBand(); })
      .attr("width", function(d) {
        return (x(d.endDate) - x(d.startDate));
      })

    if (showLabels){
      // add text label
      var label = bar.append("text")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", function(d){
          return (x(d.endDate) - x(d.startDate))/2;
        })
        .attr("y", y.rangeBand()/2)
        .attr("transform", rectTransform)
        .attr("height", function(d) { return y.rangeBand(); })
        .attr("width", 0)
        .style("text-overflow", "hidden")
        .text(function(d) {
          return d.id;
        });
    }

    if (tooltip){
      // add tooltip
      var tooltipDiv = d3.select(container).append("div")
        .attr("class","tooltip")
        .style("visibility","hidden")
	      .style("position","absolute")
	      .style("z-index",100)
	      .style("background-color", "white")
	      .style("border-radius", "5px")
	      .style("border","1px solid black")
	      .style("padding", "2px")
        .style("pointer-events", "none");

      rect.on("mouseover", function(d){
        // show tooltipDiv
        var x, y;
        if ((x = d3.event.pageX+10)+parseInt(tooltipDiv.style("width")) > document.body.clientWidth) {
          x = x-20-parseInt(tooltipDiv.style("width"));
        }
        tooltipDiv.style("left",x+"px");
        if ((y = d3.event.pageY-10)+parseInt(tooltipDiv.style("height")) > document.body.clientHeight) {
          y = y-parseInt(tooltipDiv.style("height"));
        }
        tooltipDiv.style("top",y+"px");
        tooltipDiv//.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px")
          .html(tooltip(d))
          .style("visibility", "visible");
      })
      .on("mousemove", function(){
        console.log("height:",document.body.clientHeight,event.pageY-10,parseInt(tooltipDiv.style("height")));
        console.log("width:",document.body.clientWidth,event.pageX+10,parseInt(tooltipDiv.style("width")));
        var x, y;
        if ((x = d3.event.pageX+10) > document.body.clientWidth-parseInt(tooltipDiv.style("width"))) {
          x = x-20-parseInt(tooltipDiv.style("width"));
        }
        console.log("x:",x);
        tooltipDiv.style("left",x+"px");
        if ((y = d3.event.pageY-10) > document.body.clientHeight-parseInt(tooltipDiv.style("height"))) {
          y = y-parseInt(tooltipDiv.style("height"));
        }
        console.log("y:",y);
        tooltipDiv.style("top",y+"px");
        //tooltipDiv.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
      .on("mouseout", function(){
        tooltipDiv.style("visibility", "hidden");
      })
      tooltipDiv.on("mousemove",function(){
        tooltipDiv.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
      })
    }
/*
    label.on("mousemove",function(){
      tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
    })
*/
    chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
    .transition()
    .call(xAxis);

    chart.append("g").attr("class", "y axis").transition().call(yAxis);

    return timeline;
  }

  timeline.redraw = function(events) {

    initTimeDomain(events);
    initAxis();

    var svg = d3.select("svg");

    var timelineChartGroup = svg.select(".timeline-chart");
    var bar = timelineChartGroup.selectAll("g")
      .data(events, keyFunction)
      .enter().append("g")
      .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });

    bar.append("rect")
      //.attr("rx", 5)
      //.attr("ry", 5)
      .attr("class", function(d){
        if(eventStatus[d.status] == null){
          return "bar";
        } else {
          return eventStatus[d.status];
        }
      })
      .attr("y", 0)
      .attr("height", function(d) { return y.rangeBand(); })
      .attr("width", function(d) {
        return (x(d.endDate) - x(d.startDate));
      })
    bar.append("text")
      .attr("x", function(d) { return x(d) - 3; })
      .attr("y", y.rangeBand() / 2)
      .attr("dy", ".35em")
      .text(function(d) { return d; });

    svg.select(".x").transition().call(xAxis);
    svg.select(".y").transition().call(yAxis);

    return timeline;
  };

  timeline.margin = function(value) {
    if (!arguments.length) {
      return margin;
    }
    margin = value;
    return timeline;
  };

  timeline.timeDomain = function(value) {
    if (!arguments.length) {
      return [ timeDomainStart, timeDomainEnd ];
    }
    timeDomainStart = +value[0], timeDomainEnd = +value[1];
    return timeline;
  };

  /**
  * @param {string}
  *                vale The value can be "fit" - the domain fits the data or
  *                "fixed" - fixed domain.
  */
  timeline.timeDomainMode = function(value) {
    if (!arguments.length){
      return timeDomainMode;
    }
    timeDomainMode = value;
    return timeline;
  };

  timeline.eventTypes = function(value) {
    if (!arguments.length) {
      return eventTypes;
    }
    eventTypes = value;
    return timeline;
  };

  timeline.eventStatus = function(value) {
    if (!arguments.length) {
      return eventStatus;
    }
    eventStatus = value;
    return timeline;
  };

  timeline.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = +value;
    return timeline;
  };

  timeline.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = +value;
    return timeline;
  };

  timeline.tickFormat = function(value) {
    if (!arguments.length) {
      return tickFormat;
    }
    tickFormat = value;
    return timeline;
  };

  timeline.tooltip = function(value) {
    if (!arguments.length) {
      return value;
    }
    tooltip = value;
    return timeline;
  };

  timeline.showLabels = function(value) {
    if (!arguments.length) {
      return value;
    }
    showLabels = value;
    return timeline;
  };

  timeline.container = function(value) {
    if (!arguments.length) {
      return value;
    }
    container = value;
    return timeline;
  };

  return timeline;
};
