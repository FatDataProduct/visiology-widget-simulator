(function() {
  var container = document.getElementById(w.general.renderTo);
  var props = w.props || {};
  var items = w.data?.primaryData?.items || [];

  // === Default props ===
  var orientation = props.orientation || 'horizontal';
  var normalizationMode = props.normalizationMode || 'absolute';
  var showLegend = props.showLegend !== false;
  var tooltipEnabled = props.tooltipEnabled !== false;
  var showSegmentLabels = props.showSegmentLabels !== false;
  var showTotalLabel = props.showTotalLabel !== false;
  var minSegmentLabelPct = props.minSegmentLabelPct || 5;
  var axisStartAtZero = props.axisStartAtZero !== false;
  var axisMax = props.axisMax || 0;
  var fontSize = props.fontSize || 12;
  var segmentLabelColor = props.segmentLabelColor || '#ffffff';
  var totalLabelColor = props.totalLabelColor || '#333333';
  var isNormalized = normalizationMode === 'normalized';
  var isHorizontal = orientation === 'horizontal';

  // Axis styling props
  var xAxisLabelColor = props.xAxisLabelColor || '#333333';
  var yAxisLabelColor = props.yAxisLabelColor || '#333333';
  var showXAxisLine = props.showXAxisLine !== false;
  var showYAxisLine = props.showYAxisLine !== false;
  var showXAxisLabels = props.showXAxisLabels !== false;
  var showYAxisLabels = props.showYAxisLabels !== false;

  // Mark lines
  var xAxisMarkLine = props.xAxisMarkLine || 0;
  var xAxisMarkLineColor = props.xAxisMarkLineColor || '#e74c3c';
  var yAxisMarkLine = props.yAxisMarkLine || 0;
  var yAxisMarkLineColor = props.yAxisMarkLineColor || '#e74c3c';

  // === Parse segment color map ===
  var segmentColorMap = {};
  if (props.segmentColorMapJson) {
    try {
      segmentColorMap = JSON.parse(props.segmentColorMapJson);
    } catch (e) {
      console.warn('Invalid segmentColorMapJson:', e);
    }
  }

  // === IBCS monochrome gray palette (default) ===
  var defaultSegmentColors = [
    '#404040',  // Dark gray
    '#737373',  // Medium gray
    '#A6A6A6',  // Light gray
    '#D9D9D9',  // Very light gray
    '#595959',  // Additional shades
    '#8C8C8C',
    '#BFBFBF'
  ];

  if (!items.length) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">Нет данных</div>';
    return;
  }

  // === Data structure ===
  // items[i].keys = [Category, Segment]
  // items[i].values = [Value]

  // Group data by Category and collect segments
  var categoriesMap = {};
  var segmentsSet = new Set();
  var segmentsOrder = [];

  items.forEach(function(item) {
    var category = item.keys[0];
    var segment = item.keys[1];
    var value = item.values[0] || 0;

    if (!segmentsSet.has(segment)) {
      segmentsSet.add(segment);
      segmentsOrder.push(segment);
    }

    if (!categoriesMap[category]) {
      categoriesMap[category] = {
        segments: {},
        total: 0
      };
    }

    categoriesMap[category].segments[segment] = value;
    categoriesMap[category].total += value;
  });

  var categories = Object.keys(categoriesMap);
  var segments = segmentsOrder;

  // Calculate max total for axis scaling
  var maxTotal = 0;
  categories.forEach(function(cat) {
    maxTotal = Math.max(maxTotal, categoriesMap[cat].total);
  });

  // === Build ECharts series ===
  var series = [];
  var lastSegmentIndex = segments.length - 1;

  segments.forEach(function(segName, segIdx) {
    var segColor = segmentColorMap[segName] || defaultSegmentColors[segIdx % defaultSegmentColors.length];
    var isLastSegment = (segIdx === lastSegmentIndex);

    var segmentData = categories.map(function(cat) {
      var catData = categoriesMap[cat];
      var rawValue = catData.segments[segName] || 0;
      var total = catData.total;
      var pct = total > 0 ? (rawValue / total) * 100 : 0;

      // For normalized mode, use percentage for bar width but store raw value
      var displayValue = isNormalized ? pct : rawValue;

      return {
        value: displayValue,
        rawValue: rawValue,
        pct: pct,
        total: total,
        segment: segName,
        category: cat,
        isLastSegment: isLastSegment
      };
    });

    // Build markLine config for this series (only add to first series)
    var markLineConfig = null;
    if (segIdx === 0) {
      var markLineData = [];
      
      // For horizontal orientation: X axis is value axis, Y axis is category axis
      // For vertical orientation: X axis is category axis, Y axis is value axis
      if (isHorizontal) {
        // X axis mark line (on value axis)
        if (xAxisMarkLine > 0) {
          markLineData.push({
            xAxis: xAxisMarkLine,
            lineStyle: { color: xAxisMarkLineColor, width: 2, type: 'solid' },
            label: { show: true, formatter: '{c}', color: xAxisMarkLineColor }
          });
        }
      } else {
        // Y axis mark line (on value axis)
        if (yAxisMarkLine > 0) {
          markLineData.push({
            yAxis: yAxisMarkLine,
            lineStyle: { color: yAxisMarkLineColor, width: 2, type: 'solid' },
            label: { show: true, formatter: '{c}', color: yAxisMarkLineColor }
          });
        }
      }
      
      if (markLineData.length > 0) {
        markLineConfig = {
          symbol: 'none',
          data: markLineData
        };
      }
    }

    var seriesItem = {
      name: segName,
      type: 'bar',
      stack: 'total',
      barWidth: '60%',
      itemStyle: {
        color: segColor,
        borderColor: '#fff',
        borderWidth: 0.5
      },
      emphasis: {
        itemStyle: {
          color: segColor,
          shadowBlur: 5,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      },
      label: {
        show: showSegmentLabels,
        position: 'inside',
        formatter: function(params) {
          var data = params.data;
          var pct = data.pct;
          // Hide label if segment is too small
          if (pct < minSegmentLabelPct) {
            return '';
          }
          // Show raw value (even in normalized mode per spec)
          return data.rawValue;
        },
        color: segmentLabelColor,
        fontSize: fontSize,
        fontWeight: 500
      },
      data: segmentData
    };

    if (markLineConfig) {
      seriesItem.markLine = markLineConfig;
    }

    series.push(seriesItem);
  });

  // === Axis configuration ===
  var calculatedMax = isNormalized ? 100 : (axisMax > 0 ? axisMax : maxTotal * 1.15);
  var calculatedMin = axisStartAtZero ? 0 : undefined;

  // Determine visibility for each axis based on orientation
  var showCategoryAxisLine = isHorizontal ? showYAxisLine : showXAxisLine;
  var showCategoryAxisLabels = isHorizontal ? showYAxisLabels : showXAxisLabels;
  var showValueAxisLine = isHorizontal ? showXAxisLine : showYAxisLine;
  var showValueAxisLabels = isHorizontal ? showXAxisLabels : showYAxisLabels;

  var categoryAxisConfig = {
    type: 'category',
    data: categories,
    axisLine: {
      show: showCategoryAxisLine,
      lineStyle: { color: '#333', width: 1 }
    },
    axisLabel: {
      show: showCategoryAxisLabels,
      color: isHorizontal ? yAxisLabelColor : xAxisLabelColor,
      fontSize: fontSize,
      fontWeight: 500,
      interval: 0
    },
    axisTick: { show: showCategoryAxisLine },
    splitLine: { show: false }
  };

  var valueAxisConfig = {
    type: 'value',
    min: calculatedMin,
    max: calculatedMax,
    axisLine: {
      show: isNormalized ? false : showValueAxisLine,
      lineStyle: { color: '#333', width: 1 }
    },
    axisLabel: {
      show: isNormalized ? false : showValueAxisLabels,
      color: isHorizontal ? xAxisLabelColor : yAxisLabelColor,
      fontSize: fontSize,
      formatter: function(value) {
        return value;
      }
    },
    splitLine: {
      show: !isNormalized && showValueAxisLine,
      lineStyle: {
        color: 'rgba(0,0,0,0.1)',
        type: 'solid'
      }
    },
    axisTick: { show: !isNormalized && showValueAxisLine }
  };

  // === Chart options ===
  var existingChart = echarts.getInstanceByDom(container);
  if (existingChart) existingChart.dispose();

  var chart = echarts.init(container);

  // Calculate padding for total labels
  var rightPadding = isHorizontal ? (showTotalLabel ? '15%' : '8%') : '8%';
  var topPadding = !isHorizontal ? (showTotalLabel ? '20%' : '10%') : (showLegend ? 50 : 25);

  var option = {
    backgroundColor: 'transparent',
    tooltip: tooltipEnabled ? {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      textStyle: {
        color: '#333',
        fontSize: fontSize
      },
      formatter: function(params) {
        if (params.seriesName === '_total') return null;

        var data = params.data;
        var cat = data.category;
        var seg = data.segment;
        var rawValue = data.rawValue;
        var pct = data.pct;
        var total = data.total;
        var segColor = params.color;

        var html = '<div style="font-weight:600;margin-bottom:8px;font-size:' + (fontSize + 2) + 'px;color:#333;border-bottom:1px solid #eee;padding-bottom:6px;">' + cat + '</div>';

        html += '<div style="display:flex;align-items:center;margin:6px 0;">' +
          '<span style="display:inline-block;width:12px;height:12px;background:' + segColor + ';margin-right:8px;border-radius:2px;"></span>' +
          '<span style="color:#666;font-weight:500;">' + seg + '</span>' +
          '</div>';

        html += '<div style="margin-left:20px;color:#333;">';
        html += '<div style="margin:4px 0;">Значение: <strong>' + rawValue + '</strong></div>';
        html += '<div style="margin:4px 0;">Доля: <strong>' + pct.toFixed(1) + '%</strong></div>';
        html += '</div>';

        html += '<div style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;color:#666;">';
        html += 'Итого по ' + cat + ': <strong style="color:#333;">' + total + '</strong>';
        html += '</div>';

        return html;
      }
    } : { show: false },
    legend: showLegend ? {
      data: segments,
      textStyle: {
        color: '#333',
        fontSize: fontSize
      },
      top: 5,
      itemGap: 20,
      itemWidth: 18,
      itemHeight: 12,
      icon: 'rect'
    } : { show: false },
    grid: {
      left: isHorizontal ? '8%' : '12%',
      right: rightPadding,
      top: topPadding,
      bottom: isNormalized ? '8%' : '12%',
      containLabel: true
    },
    xAxis: isHorizontal ? valueAxisConfig : categoryAxisConfig,
    yAxis: isHorizontal ? categoryAxisConfig : valueAxisConfig,
    series: series
  };

  // Reverse category axis for horizontal orientation (IBCS convention: first category at top)
  if (isHorizontal) {
    option.yAxis.inverse = true;
  }

  chart.setOption(option);

  // === Add total labels using graphic elements (more reliable positioning) ===
  if (showTotalLabel) {
    setTimeout(function() {
      var graphicElements = [];
      
      categories.forEach(function(cat, catIdx) {
        var total = categoriesMap[cat].total;
        
        if (isHorizontal) {
          // For horizontal bars, find the end position of the stacked bar
          var yValue = chart.convertToPixel({ yAxisIndex: 0 }, cat);
          var xValue = isNormalized 
            ? chart.convertToPixel({ xAxisIndex: 0 }, 100)
            : chart.convertToPixel({ xAxisIndex: 0 }, total);
          
          graphicElements.push({
            type: 'text',
            left: xValue + 8,
            top: yValue - fontSize / 2,
            style: {
              text: String(total),
              fill: totalLabelColor,
              fontSize: fontSize,
              fontWeight: 600
            }
          });
        } else {
          // For vertical bars
          var xValue = chart.convertToPixel({ xAxisIndex: 0 }, cat);
          var yValue = isNormalized
            ? chart.convertToPixel({ yAxisIndex: 0 }, 100)
            : chart.convertToPixel({ yAxisIndex: 0 }, total);
          
          graphicElements.push({
            type: 'text',
            left: xValue - fontSize,
            top: yValue - fontSize - 8,
            style: {
              text: String(total),
              fill: totalLabelColor,
              fontSize: fontSize,
              fontWeight: 600,
              textAlign: 'center'
            }
          });
        }
      });
      
      chart.setOption({
        graphic: graphicElements
      });
    }, 100);
  }

  // === ResizeObserver for responsiveness ===
  var resizeObserver = new ResizeObserver(function() {
    chart.resize();
    
    // Re-render total labels on resize
    if (showTotalLabel) {
      setTimeout(function() {
        var graphicElements = [];
        
        categories.forEach(function(cat, catIdx) {
          var total = categoriesMap[cat].total;
          
          if (isHorizontal) {
            var yValue = chart.convertToPixel({ yAxisIndex: 0 }, cat);
            var xValue = isNormalized 
              ? chart.convertToPixel({ xAxisIndex: 0 }, 100)
              : chart.convertToPixel({ xAxisIndex: 0 }, total);
            
            graphicElements.push({
              type: 'text',
              left: xValue + 8,
              top: yValue - fontSize / 2,
              style: {
                text: String(total),
                fill: totalLabelColor,
                fontSize: fontSize,
                fontWeight: 600
              }
            });
          } else {
            var xValue = chart.convertToPixel({ xAxisIndex: 0 }, cat);
            var yValue = isNormalized
              ? chart.convertToPixel({ yAxisIndex: 0 }, 100)
              : chart.convertToPixel({ yAxisIndex: 0 }, total);
            
            graphicElements.push({
              type: 'text',
              left: xValue - fontSize,
              top: yValue - fontSize - 8,
              style: {
                text: String(total),
                fill: totalLabelColor,
                fontSize: fontSize,
                fontWeight: 600,
                textAlign: 'center'
              }
            });
          }
        });
        
        chart.setOption({
          graphic: graphicElements
        });
      }, 50);
    }
  });
  resizeObserver.observe(container);
})();
