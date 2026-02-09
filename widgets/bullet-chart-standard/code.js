(function() {
  var container = document.getElementById(w.general.renderTo);
  var props = w.props || {};
  var items = w.data?.primaryData?.items || [];

  // === Default props ===
  var orientation = props.orientation || 'vertical';
  var showLegend = props.showLegend !== false;
  var tooltipEnabled = props.tooltipEnabled !== false;
  var showCategoryLabels = props.showCategoryLabels !== false;
  var actualColor = props.actualColor || '#2c3e50';
  var targetColor = props.targetColor || '#e74c3c';
  var actualBarWidthPct = props.actualBarWidthPct || 25;
  var rangeBarWidthPct = props.rangeBarWidthPct || 60;
  var targetMarkerThickness = props.targetMarkerThickness || 6;
  var targetMarkerLengthPct = props.targetMarkerLengthPct || 60;
  var axisStartAtZero = props.axisStartAtZero !== false;
  var axisMin = props.axisMin || 0;
  var axisMax = props.axisMax || 0;
  var axisMaxPaddingPct = props.axisMaxPaddingPct || 5;
  var fontSize = props.fontSize || 12;
  var categoryLabelAlign = props.categoryLabelAlign || 'center';

  // === Parse segment color map ===
  var segmentColorMap = {};
  if (props.segmentColorMapJson) {
    try {
      segmentColorMap = JSON.parse(props.segmentColorMapJson);
    } catch (e) {
      console.warn('Invalid segmentColorMapJson:', e);
    }
  }

  // === Default segment colors (from light to dark - for bullet chart qualitative ranges) ===
  var defaultSegmentColors = [
    'rgba(220, 220, 220, 0.95)',  // Lightest (e.g., Low/Poor)
    'rgba(180, 180, 180, 0.95)',  // Medium
    'rgba(140, 140, 140, 0.95)',  // Darker (e.g., High/Good)
    'rgba(110, 110, 110, 0.95)',
    'rgba(85, 85, 85, 0.95)'
  ];

  if (!items.length) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">Нет данных</div>';
    return;
  }

  // === Data structure ===
  // items[i].keys = [Category, Segment]
  // items[i].values = [Actual, Target, Step, Step_index]

  // Group data by Category
  var categoriesMap = {};
  var segmentsSet = new Set();

  items.forEach(function(item) {
    var category = item.keys[0];
    var segment = item.keys[1];
    var actual = item.values[0];
    var target = item.values[1];
    var step = item.values[2];
    var stepIndex = item.values[3];

    segmentsSet.add(segment);

    if (!categoriesMap[category]) {
      categoriesMap[category] = {
        actual: actual,
        target: target,
        segments: []
      };
    }

    categoriesMap[category].segments.push({
      name: segment,
      step: step,
      index: stepIndex
    });
  });

  var categories = Object.keys(categoriesMap);

  // Sort segments within each category by step_index
  categories.forEach(function(cat) {
    categoriesMap[cat].segments.sort(function(a, b) {
      return a.index - b.index;
    });
  });

  // Get unique sorted segments based on first category (descending order for proper overlay)
  var sortedSegments = [];
  if (categories.length > 0) {
    sortedSegments = categoriesMap[categories[0]].segments.map(function(s) {
      return s.name;
    });
  }

  // Calculate cumulative values for each segment (for bullet chart style)
  categories.forEach(function(cat) {
    var data = categoriesMap[cat];
    var cumulative = 0;
    data.segments.forEach(function(seg) {
      cumulative += seg.step;
      seg.cumulative = cumulative;
    });
    data.totalRange = cumulative;
  });

  // === Calculate axis range ===
  var maxValue = 0;
  categories.forEach(function(cat) {
    var data = categoriesMap[cat];
    maxValue = Math.max(maxValue, data.totalRange, data.actual, data.target);
  });

  var calculatedMax = axisMax > 0 ? axisMax : maxValue * (1 + axisMaxPaddingPct / 100);
  var calculatedMin = axisStartAtZero ? 0 : axisMin;

  // === Build ECharts series ===
  var series = [];
  var isVertical = orientation === 'vertical';

  // For bullet chart: create bars from largest cumulative to smallest (so they overlay properly)
  // Reverse the segments so the largest (highest cumulative) is rendered first (at back)
  var reversedSegments = sortedSegments.slice().reverse();

  reversedSegments.forEach(function(segName, idx) {
    var originalIdx = sortedSegments.length - 1 - idx;
    
    // For each category, get the cumulative value up to this segment
    var segmentData = categories.map(function(cat) {
      var seg = categoriesMap[cat].segments.find(function(s) {
        return s.name === segName;
      });
      return seg ? seg.cumulative : 0;
    });

    var segColor = segmentColorMap[segName] || defaultSegmentColors[originalIdx % defaultSegmentColors.length];

    series.push({
      name: segName,
      type: 'bar',
      barWidth: rangeBarWidthPct + '%',
      barGap: '-100%', // Overlay bars on same position
      itemStyle: {
        color: segColor,
        borderRadius: isVertical ? [3, 3, 0, 0] : [0, 3, 3, 0]
      },
      emphasis: {
        itemStyle: {
          color: segColor,
          shadowBlur: 5,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      },
      data: segmentData,
      z: originalIdx + 1 // Lower z for segments rendered first
    });
  });

  // Create Actual bars (narrower, on top of everything)
  var actualData = categories.map(function(cat) {
    return categoriesMap[cat].actual;
  });

  series.push({
    name: 'Actual',
    type: 'bar',
    barWidth: actualBarWidthPct + '%',
    barGap: '-100%',
    itemStyle: {
      color: actualColor,
      borderRadius: isVertical ? [2, 2, 0, 0] : [0, 2, 2, 0]
    },
    emphasis: {
      itemStyle: {
        color: actualColor,
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.4)'
      }
    },
    data: actualData,
    z: 10
  });

  // Create Target markers using scatter with rect symbol
  series.push({
    name: 'Target',
    type: 'scatter',
    symbol: 'rect',
    symbolSize: function(val, params) {
      // Calculate pixel width based on container
      var containerWidth = container.offsetWidth || 400;
      var containerHeight = container.offsetHeight || 300;
      var barSpace = isVertical ? (containerWidth * 0.8 / categories.length) : (containerHeight * 0.8 / categories.length);
      var markerLength = barSpace * (targetMarkerLengthPct / 100);
      
      if (isVertical) {
        return [Math.max(markerLength, 20), targetMarkerThickness];
      } else {
        return [targetMarkerThickness, Math.max(markerLength, 20)];
      }
    },
    itemStyle: {
      color: targetColor,
      borderColor: targetColor,
      borderWidth: 0
    },
    emphasis: {
      itemStyle: {
        color: targetColor,
        shadowBlur: 5,
        shadowColor: 'rgba(0,0,0,0.3)'
      }
    },
    data: categories.map(function(cat) {
      return categoriesMap[cat].target;
    }),
    z: 15
  });

  // === Axis configuration ===
  var categoryAxis = {
    type: 'category',
    data: categories,
    axisLine: { 
      show: true,
      lineStyle: { color: '#555', width: 1 } 
    },
    axisLabel: {
      show: showCategoryLabels,
      color: '#b0b0b0',
      fontSize: fontSize,
      fontWeight: 500
    },
    axisTick: { show: false },
    splitLine: { show: false }
  };

  var valueAxis = {
    type: 'value',
    min: calculatedMin,
    max: calculatedMax,
    axisLine: { 
      show: true,
      lineStyle: { color: '#555', width: 1 } 
    },
    axisLabel: { 
      color: '#b0b0b0', 
      fontSize: fontSize 
    },
    splitLine: { 
      lineStyle: { 
        color: 'rgba(100,100,100,0.2)',
        type: 'dashed'
      } 
    }
  };

  // === Chart options ===
  var existingChart = echarts.getInstanceByDom(container);
  if (existingChart) existingChart.dispose();

  var chart = echarts.init(container);

  var option = {
    backgroundColor: 'transparent',
    tooltip: tooltipEnabled ? {
      trigger: 'axis',
      axisPointer: { 
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(150,150,150,0.1)'
        }
      },
      backgroundColor: 'rgba(30, 35, 45, 0.95)',
      borderColor: 'rgba(100, 100, 100, 0.3)',
      borderWidth: 1,
      textStyle: {
        color: '#e0e0e0',
        fontSize: fontSize
      },
      formatter: function(params) {
        var cat = params[0].axisValue;
        var data = categoriesMap[cat];
        var html = '<div style="font-weight:600;margin-bottom:8px;font-size:' + (fontSize + 2) + 'px;color:#fff;">' + cat + '</div>';
        
        // Show segments (in order)
        html += '<div style="margin-bottom:8px;">';
        data.segments.forEach(function(seg, i) {
          var color = segmentColorMap[seg.name] || defaultSegmentColors[i % defaultSegmentColors.length];
          html += '<div style="display:flex;align-items:center;margin:3px 0;">' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + color + ';margin-right:8px;border-radius:2px;"></span>' +
            '<span style="color:#aaa;">' + seg.name + ':</span>' +
            '<span style="margin-left:auto;font-weight:500;">' + seg.step + '</span>' +
            '<span style="color:#666;margin-left:5px;">(до ' + seg.cumulative + ')</span>' +
            '</div>';
        });
        html += '</div>';
        
        // Actual & Target
        html += '<div style="border-top:1px solid rgba(100,100,100,0.3);padding-top:8px;">';
        html += '<div style="display:flex;align-items:center;margin:3px 0;">' +
          '<span style="display:inline-block;width:12px;height:12px;background:' + actualColor + ';margin-right:8px;border-radius:2px;"></span>' +
          '<span style="color:#aaa;">Actual:</span>' +
          '<span style="margin-left:auto;font-weight:600;color:#fff;">' + data.actual + '</span>' +
          '</div>';
        html += '<div style="display:flex;align-items:center;margin:3px 0;">' +
          '<span style="display:inline-block;width:12px;height:4px;background:' + targetColor + ';margin-right:8px;"></span>' +
          '<span style="color:#aaa;">Target:</span>' +
          '<span style="margin-left:auto;font-weight:600;color:#fff;">' + data.target + '</span>' +
          '</div>';
        html += '</div>';
        
        // Performance indicator
        var perf = ((data.actual / data.target) * 100).toFixed(1);
        var perfColor = data.actual >= data.target ? '#2ecc71' : '#e74c3c';
        html += '<div style="margin-top:8px;text-align:center;font-size:' + (fontSize - 1) + 'px;color:' + perfColor + ';">' +
          (data.actual >= data.target ? '✓' : '✗') + ' ' + perf + '% от цели</div>';
        
        return html;
      }
    } : { show: false },
    legend: showLegend ? {
      data: sortedSegments.concat(['Actual', 'Target']),
      textStyle: { 
        color: '#b0b0b0', 
        fontSize: fontSize 
      },
      top: 5,
      itemGap: 20,
      itemWidth: 18,
      itemHeight: 12,
      icon: 'roundRect'
    } : { show: false },
    grid: {
      left: '8%',
      right: '8%',
      top: showLegend ? 50 : 25,
      bottom: '12%',
      containLabel: true
    },
    xAxis: isVertical ? categoryAxis : valueAxis,
    yAxis: isVertical ? valueAxis : categoryAxis,
    series: series
  };

  chart.setOption(option);

  // === ResizeObserver for responsiveness ===
  var resizeObserver = new ResizeObserver(function() {
    chart.resize();
  });
  resizeObserver.observe(container);
})();
