/*!
 * jquery.drawPieChart.js
 * Version: 0.1(Beta)
 * Inspired by Chart.js(http://www.chartjs.org/)
 *
 * Copyright 2013 hiro
 * https://github.com/githiro/drawPieChart
 * Released under the MIT license.
 * 
 */
;(function($, undefined) {
  $.fn.drawPieChart = function(data, options) {
    var $this = this,
      W = $this.width(),
      H = $this.height(),
      centerX = W/2,
      centerY = H/2,
      cos = Math.cos,
      sin = Math.sin,
      PI = Math.PI,
      settings = $.extend({
        segmentShowStroke : true,
        segmentStrokeColor : "#fff",
        segmentStrokeWidth : 1,
        baseColor: "#fff",
        baseOffset: 15,
        edgeOffset: 20,//offset from edge of $this
        pieSegmentGroupClass: "pieSegmentGroup",
        pieSegmentClass: "pieSegment",
        lightPiesOffset: 10,//lighten pie's width
        lightPiesOpacity: .2,//lighten pie's default opacity
        lightPieClass: "lightPie",
        animation : true,
        animationSteps : 90,
        animationEasing : "easeInOutExpo",
        tipOffsetX: -10,
        tipOffsetY: -45,
        tipClass: "pieTip",
        beforeDraw: function(){  },
        afterDrawed : function(){  },
        onPieMouseenter : function(e,data){  },
        onPieMouseleave : function(e,data){  },
        onPieClick : function(e,data){  }
      }, options),
      animationOptions = {
        linear : function (t){
          return t;
        },
        easeInOutExpo: function (t) {
          var v = t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t;
          return (v>1) ? 1 : v;
        }
      };
    var requestAnimFrame = function(){
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    }();

    var $svg = $('<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"></svg>').appendTo($this),
      $groups = [],
      $pies = [],
      $lightPies = [],
      easingFunction = animationOptions[settings.animationEasing],
      pieRadius = Min([H/2,W/2]) - settings.edgeOffset,
      segmentTotal = 0;

    settings.beforeDraw.call($this);

    //Draw base circle
    var drawBasePie = function(){
      var svgBase = document.createElementNS('http://www.w3.org/2000/svg', 'circle'),
        $svgBase = $(svgBase).appendTo($svg);
      $svgBase[0].setAttribute("cx", centerX);
      $svgBase[0].setAttribute("cy", centerY);
      $svgBase[0].setAttribute("r", pieRadius+settings.baseOffset);
      $svgBase[0].setAttribute("fill", settings.baseColor);
    }();

    //Set up pie segments wrapper
    var pathGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    var $pathGroup = $(pathGroup).appendTo($svg);
    $pathGroup[0].setAttribute("opacity",0);

    //Set up tooltip
    var $tip = $('<div class="' + settings.tipClass + '" />').appendTo('body').hide(),
      tipW = $tip.width(),
      tipH = $tip.height();

    for (var i = 0, len = data.length; i < len; i++){
      segmentTotal += data[i].value;
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute("data-order", i);
      g.setAttribute("class", settings.pieSegmentGroupClass);
      $groups[i] = $(g).appendTo($pathGroup);
      $groups[i]
        .on("mouseenter", pathMouseEnter)
        .on("mouseleave", pathMouseLeave)
        .on("mousemove", pathMouseMove)
        .on("click", pathClick);

      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute("stroke-width", settings.segmentStrokeWidth);
      p.setAttribute("stroke", settings.segmentStrokeColor);
      p.setAttribute("stroke-miterlimit", 2);
      p.setAttribute("fill", data[i].color);
      p.setAttribute("class", settings.pieSegmentClass);
      $pies[i] = $(p).appendTo($groups[i]);

      var lp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      lp.setAttribute("stroke-width", settings.segmentStrokeWidth);
      lp.setAttribute("stroke", settings.segmentStrokeColor);
      lp.setAttribute("stroke-miterlimit", 2);
      lp.setAttribute("fill", data[i].color);
      lp.setAttribute("opacity", 1);
      lp.setAttribute("class", settings.lightPieClass);
      $lightPies[i] = $(lp).appendTo($groups[i]);
    }

    //Animation start
    animationLoop(drawPieSegments);

    function pathMouseEnter(e){
      var index = $(this).data().order;
      $tip.text(data[index].title + ": " + data[index].value).fadeIn(200);
      if ($groups[index][0].getAttribute("data-active") !== "active"){
        $lightPies[index].animate({opacity: .7}, 100);
      }
      settings.onPieMouseenter.apply($(this),[e,data]);
    }
    function pathMouseLeave(e){
      var index = $(this).data().order;
      $tip.hide();
      if ($groups[index][0].getAttribute("data-active") !== "active"){
        $lightPies[index].animate({opacity: settings.lightPiesOpacity}, 100);
      }
      settings.onPieMouseleave.apply($(this),[e,data]);
    }
    function pathMouseMove(e){
      $tip.css({
        top: e.pageY + settings.tipOffsetY,
        left: e.pageX - $tip.width() / 2 + settings.tipOffsetX
      });
    }
    function pathClick(e){
      var index = $(this).data().order;
      for (var i = 0, len = data.length; i < len; i++){
        $groups[i][0].setAttribute("data-active","");
        $lightPies[i].css({opacity: settings.lightPiesOpacity});
      }
      $lightPies[index].css({opacity: 1});
      $groups[index][0].setAttribute("data-active","active");
      settings.onPieClick.apply($(this),[e,data]);
    }
    function drawPieSegments (animationDecimal){
      var startRadius = -Math.PI/2,//-90 degree
        rotateAnimation = 1;
      if (settings.animation) {
        rotateAnimation = animationDecimal;//count up between0~1
      }

      $pathGroup[0].setAttribute("opacity",animationDecimal);

      //draw each path
      for (var i = 0, len = data.length; i < len; i++){
        var segmentAngle = rotateAnimation * ((data[i].value/segmentTotal) * (PI*2)),
          endRadius = startRadius + segmentAngle,
          largeArc = ((endRadius - startRadius) % (PI * 2)) > PI ? 1 : 0,
          startX = centerX + cos(startRadius) * pieRadius,
          startY = centerY + sin(startRadius) * pieRadius,
          endX = centerX + cos(endRadius) * pieRadius,
          endY = centerY + sin(endRadius) * pieRadius,
          startX2 = centerX + cos(startRadius) * (pieRadius + settings.lightPiesOffset),
          startY2 = centerY + sin(startRadius) * (pieRadius + settings.lightPiesOffset),
          endX2 = centerX + cos(endRadius) * (pieRadius + settings.lightPiesOffset),
          endY2 = centerY + sin(endRadius) * (pieRadius + settings.lightPiesOffset);
        var cmd = [
          'M', startX, startY,//Move pointer
          'A', pieRadius, pieRadius, 0, largeArc, 1, endX, endY,//Draw outer arc path
          'L', centerX, centerY,//Draw line to the center.
          'Z'//Cloth path
        ];
        var cmd2 = [
          'M', startX2, startY2,
          'A', pieRadius + settings.lightPiesOffset, pieRadius + settings.lightPiesOffset, 0, largeArc, 1, endX2, endY2,//Draw outer arc path
          'L', centerX, centerY,
          'Z'
        ];
        $pies[i][0].setAttribute("d",cmd.join(' '));
        $lightPies[i][0].setAttribute("d", cmd2.join(' '));
        startRadius += segmentAngle;
      }
    }

    function animateFrame(cnt, drawData){
      var easeAdjustedAnimationPercent =(settings.animation)? CapValue(easingFunction(cnt),null,0) : 1;
      drawData(easeAdjustedAnimationPercent);
    }
    function animationLoop(drawData){
      var animFrameAmount = (settings.animation)? 1/CapValue(settings.animationSteps,Number.MAX_VALUE,1) : 1,
        cnt =(settings.animation)? 0 : 1;
      requestAnimFrame(function(){
          cnt += animFrameAmount;
          animateFrame(cnt, drawData);
          if (cnt <= 1){
            requestAnimFrame(arguments.callee);
          } else {
            for (var i = 0, len = data.length; i < len; i++){
              $lightPies[i].animate({opacity: settings.lightPiesOpacity}, 250);
            }
            settings.afterDrawed.call($this);
          }
      });
    }
    function Max(arr){
      return Math.max.apply(null, arr);
    }
    function Min(arr){
      return Math.min.apply(null, arr);
    }
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function CapValue(valueToCap, maxValue, minValue){
      if(isNumber(maxValue)) {
        if( valueToCap > maxValue ) {
          return maxValue;
        }
      }
      if(isNumber(minValue)){
        if ( valueToCap < minValue ){
          return minValue;
        }
      }
      return valueToCap;
    }
    return $this;
  };
})(jQuery);