/**
 * HR Dashboard — Chart.js 4.x
 * e-HR DashBoardTab01 차트 패턴 + 샘플 데이터(스크린샷 기준)
 *
 * WORK LOG
 * [2026-10-02] 초기 작성 — KPI / 본부·직책·직급3개년·연령피라미드
 */
(function (window, $) {
  'use strict';

  /**
   * Tailwind 400 계열 hex 참조 — 라이브러리 미사용
   * 본부·직급: 01 기본 400 / 01_ 다른 안 7색
   */
  var TW = {
    blue400: '#60a5fa',
    orange400: '#fb923c',
    slate400: '#94a3b8',
    amber400: '#fbbf24',
    sky400: '#38bdf8',
    emerald400: '#34d399',
    violet400: '#a78bfa',
    red400: '#f87171',
    cyan400: '#22d3ee',
    pink400: '#f472b6',
    skyHover: '#0ea5e9',
    orangeHover: '#f97316'
  };
  /** dashboard01 기본 — Tailwind 400 */
  var GRADE_PALETTE_DEFAULT = [
    TW.blue400, TW.orange400, TW.slate400, TW.amber400,
    TW.sky400, TW.emerald400, TW.violet400
  ];
  /** dashboard01_ 다른 안 — 사원·계약 violet/fuchsia */
  var GRADE_PALETTE_ALT = [
    '#f87171', /* 임원 red-400 */
    '#fb923c', /* 부장 orange-400 */
    '#fbbf24', /* 차장 amber-400 */
    '#a3e635', /* 과장 lime-400 */
    '#34d399', /* 대리 emerald-400 */
    '#a78bfa', /* 사원 violet-400 */
    '#e879f9'  /* 계약 fuchsia-400 */
  ];
  var GRADE_PALETTE = GRADE_PALETTE_DEFAULT;
  var GRADE_ORDER = ['임원', '부장', '차장', '과장', '대리', '사원', '계약'];
  var COLOR_MALE = TW.blue400;
  var COLOR_FEMALE = TW.red400;
  var COLOR_IT = TW.sky400;
  var COLOR_CS = TW.orange400;
  var CHART_FONT = '"Pretendard GOV", "Malgun Gothic", sans-serif';
  var AXIS_LINE = { display: true, color: '#e2e8f0', width: 1 }; /* slate-200 */
  /** 차트 UI 공통 — 항목 글자/범례/간격 일관 */
  var CHART_UI = {
    tickSize: 13,
    legendSize: 13,
    barLabelSize: 12,
    barTotalSize: 13,
    legendBox: 14,
    legendPad: 18,
    tickPad: 12, /* 항목 라벨 ↔ 막대 간격 */
    barPct: 0.62,
    catPct: 0.78,
    layout: { top: 10, right: 28, bottom: 6, left: 6 }
  };
  var charts = {};

  function tickFont() {
    return { size: CHART_UI.tickSize, family: CHART_FONT, weight: '500' };
  }

  function legendOpts() {
    return {
      position: 'top',
      align: 'end',
      labels: {
        font: { size: CHART_UI.legendSize, family: CHART_FONT, weight: '600' },
        boxWidth: CHART_UI.legendBox,
        boxHeight: CHART_UI.legendBox,
        padding: CHART_UI.legendPad,
        usePointStyle: false
      }
    };
  }

  function barGap(ds) {
    return $.extend({
      borderWidth: 0,
      barPercentage: CHART_UI.barPct,
      categoryPercentage: CHART_UI.catPct
    }, ds || {});
  }

  /** 스크린샷 기준 샘플 데이터 (백엔드 연동 전 로컬 미리보기) */
  var SAMPLE = {
    kpi: { work: 945, it: 513, cs: 432, leave: 6, join: 37, retire: 39, disabil: 12, bohun: 0, foreign: 0 },
    gender: { male: 292, female: 179 },
    hq: {
      labels: [
        '전략기획실', 'IT기획부', '디지털혁신부', '클라우드사업부',
        '시스템운영부', '고객서비스본부', '영업본부', '경영지원본부', '연구소'
      ],
      grades: {
        '임원': [2, 1, 1, 2, 1, 2, 3, 2, 1],
        '부장': [4, 6, 5, 8, 7, 9, 10, 6, 4],
        '차장': [6, 10, 12, 14, 11, 15, 12, 8, 7],
        '과장': [8, 18, 22, 28, 20, 30, 24, 14, 12],
        '대리': [10, 24, 28, 36, 30, 40, 32, 18, 16],
        '사원': [12, 40, 48, 55, 50, 70, 45, 22, 20],
        '계약': [2, 6, 8, 10, 9, 12, 8, 4, 3]
      }
    },
    jikchak: {
      labels: ['본부장', '실장', '팀장', '파트장'],
      male: [8, 12, 42, 28],
      female: [2, 4, 18, 15]
    },
    gradeYear: {
      labels: ['2026', '2025', '2024'],
      grades: {
        '임원': [15, 14, 13],
        '부장': [58, 55, 52],
        '차장': [95, 90, 88],
        '과장': [176, 168, 160],
        '대리': [234, 220, 210],
        '사원': [327, 310, 295],
        '계약': [40, 38, 36]
      }
    },
    age: {
      labels: ['50이상', '40~49', '30~39', '20~29'],
      male: [38, 92, 110, 52],
      female: [18, 48, 67, 46]
    }
  };

  function num(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  function fmt(v) {
    return num(v).toLocaleString('ko-KR');
  }

  function darkenColor(hex, amount) {
    var h = String(hex || '').replace('#', '');
    if (h.length !== 6) return hex;
    var n = parseInt(h, 16);
    if (!isFinite(n)) return hex;
    var r = Math.max(0, ((n >> 16) & 255) - amount);
    var g = Math.max(0, ((n >> 8) & 255) - amount);
    var b = Math.max(0, (n & 255) - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function barProps(bar) {
    if (bar.getProps) return bar.getProps(['x', 'y', 'base', 'width', 'height'], true);
    return { x: bar.x, y: bar.y, base: bar.base, width: bar.width, height: bar.height };
  }

  /** 배경 명도에 따라 안쪽 라벨 색 — 어두우면 흰색 */
  function contrastLabelColor(bg, light, dark) {
    light = light || '#ffffff';
    dark = dark || '#475569';
    if (!bg || typeof bg !== 'string') return dark;
    var h = bg.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return dark;
    var n = parseInt(h, 16);
    if (!isFinite(n)) return dark;
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    function lin(c) {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    var L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L < 0.55 ? light : dark;
  }

  function datasetFillAt(ds, idx) {
    var bg = ds && ds.backgroundColor;
    if ($.isArray(bg)) return bg[idx];
    return bg;
  }

  /**
   * Chart.js afterDatasetsDraw — 막대 안 건수 / 행 총원
   * opt.callout: 모든 구간 수치를 선으로 밖으로 빼서 표시 (세로·가로 누적)
   * 직책자·성별연령 등은 callout 없이 막대 안 표시 유지
   */
  var barCountPlugin = {
    id: 'hrBarCount',
    afterDatasetsDraw: function (chart) {
      var opt = chart.options.plugins && chart.options.plugins.hrBarCount;
      if (!opt || !chart.$hrLabelsReady) return;
      var ctx = chart.ctx;
      var horiz = chart.options.indexAxis === 'y';
      var n = chart.data.labels.length;
      var labelColor = opt.color || '#475569';
      var lineColor = opt.lineColor || '#cbd5e1'; /* slate-300 — 흐린 콜아웃 선 */
      var fontSize = CHART_UI.barLabelSize;
      var calloutOn = !!opt.callout;
      var calloutsByIdx = {};

      ctx.save();
      ctx.font = 'bold ' + fontSize + 'px ' + CHART_FONT;

      chart.data.datasets.forEach(function (ds, di) {
        if (!chart.isDatasetVisible(di)) return;
        var meta = chart.getDatasetMeta(di);
        (meta.data || []).forEach(function (bar, idx) {
          var val = Math.abs(num(ds.data[idx]));
          if (val <= 0 || !bar) return;
          var p = barProps(bar);
          var seg = horiz ? Math.abs(p.x - p.base) : Math.abs(p.y - p.base);
          var x = horiz ? (p.x + p.base) / 2 : p.x;
          var y = horiz ? p.y : (p.y + p.base) / 2;
          var halfThick = horiz
            ? ((p.height != null ? p.height : 20) / 2)
            : ((p.width != null ? p.width : 24) / 2);

          if (calloutOn) {
            if (!calloutsByIdx[idx]) calloutsByIdx[idx] = [];
            calloutsByIdx[idx].push({
              val: val,
              seg: seg,
              cx: x,
              cy: y,
              halfThick: halfThick,
              /* 세로 막대: 오른쪽(1) / 가로 막대: 아래(1) 로 통일 */
              side: 1
            });
            return;
          }

          /* 막대 안: 어두운 배경이면 흰 글자 */
          ctx.fillStyle = contrastLabelColor(datasetFillAt(ds, idx), '#ffffff', labelColor);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), x, y);
        });
      });

      /* 콜아웃: 모든 구간 수치 (regular weight) */
      if (calloutOn) {
        var arm = 12;
        var stackGap = fontSize + 2;
        ctx.font = fontSize + 'px ' + CHART_FONT;
        Object.keys(calloutsByIdx).forEach(function (key) {
          var list = calloutsByIdx[key];
          if (!list || !list.length) return;

          if (horiz) {
            /* 가로 막대: 하단 콜아웃 — 숫자는 같은 높이(가로선)에 정렬 */
            var hDiag = opt.calloutStyle === 'diagonal';
            var minGapX = Math.max(stackGap + 4, 18);
            var ca = chart.chartArea || {};
            var maxY = (ca.bottom != null ? ca.bottom : chart.height) - 2;
            var maxX = (ca.right != null ? ca.right : chart.width) - 4;
            var minX = (ca.left != null ? ca.left : 0) + 4;

            list.sort(function (a, b) { return a.cx - b.cx; });

            /* 공통 baseline Y (막대 아래, 차트 영역 안) */
            var deepest = -Infinity;
            list.forEach(function (it) {
              var ey = it.cy + it.halfThick;
              if (ey > deepest) deepest = ey;
            });
            var rowY = deepest + arm + 4;
            if (rowY > maxY - fontSize) rowY = maxY - fontSize;

            var prevLabelX = -Infinity;
            list.forEach(function (item) {
              item.labelX = item.cx;
              var tw = ctx.measureText(String(item.val)).width + 4;
              if (item.labelX - prevLabelX < minGapX) {
                item.labelX = prevLabelX + minGapX;
              }
              if (item.labelX + tw / 2 > maxX) item.labelX = maxX - tw / 2;
              if (item.labelX < minX) item.labelX = minX;
              prevLabelX = item.labelX;
            });

            list.forEach(function (item) {
              var dir = item.side; /* 1 = 아래 */
              var edgeY = item.cy + dir * item.halfThick;
              var textX = item.labelX;
              var textY = rowY;

              ctx.strokeStyle = lineColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(item.cx, edgeY);
              if (hDiag) {
                ctx.lineTo(textX, textY);
              } else {
                var elbowY = Math.min(edgeY + dir * arm, textY);
                ctx.lineTo(item.cx, elbowY);
                if (Math.abs(textX - item.cx) > 0.5) {
                  ctx.lineTo(textX, elbowY);
                }
                ctx.lineTo(textX, textY);
              }
              ctx.stroke();

              ctx.beginPath();
              ctx.fillStyle = lineColor;
              ctx.arc(item.cx, edgeY, 1.4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = labelColor;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(String(item.val), textX, textY + 1);
            });
          } else {
            /* 세로 막대: 오른쪽 콜아웃 (diagonal=대각선·위쪽, 숫자는 세로 한 줄 정렬) */
            var diag = opt.calloutStyle === 'diagonal';
            var areaTop = (chart.chartArea && chart.chartArea.top != null)
              ? chart.chartArea.top + fontSize
              : fontSize;
            var colX = -Infinity;
            list.forEach(function (item) {
              var ex = item.cx + item.side * item.halfThick;
              if (ex > colX) colX = ex;
            });
            colX = colX + arm + 6; /* 모든 수치 공통 X (세로 정렬) */

            if (diag) {
              /* 아래 구간부터 배치 → 겹치면 위로 밀어 항목명 영역 침범 방지 */
              list.sort(function (a, b) { return b.cy - a.cy; });
              var prevUp = Infinity;
              list.forEach(function (item) {
                item.labelY = item.cy;
                if (prevUp - item.labelY < stackGap) {
                  item.labelY = prevUp - stackGap;
                }
                if (item.labelY < areaTop) item.labelY = areaTop;
                prevUp = item.labelY;
              });
            } else {
              list.sort(function (a, b) { return a.cy - b.cy; });
              var prevLabelY = -Infinity;
              list.forEach(function (item) {
                item.labelY = item.cy;
                if (item.labelY - prevLabelY < stackGap) {
                  item.labelY = prevLabelY + stackGap;
                }
                prevLabelY = item.labelY;
              });
            }

            list.forEach(function (item) {
              var dir = item.side;
              var edgeX = item.cx + dir * item.halfThick;
              var textX = colX;

              ctx.strokeStyle = lineColor;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(edgeX, item.cy);
              if (diag) {
                /* 대각선 → 세로 정렬된 숫자 열 */
                ctx.lineTo(textX, item.labelY);
                ctx.lineTo(textX + dir * 4, item.labelY);
              } else {
                var elbowX = edgeX + dir * arm;
                ctx.lineTo(elbowX, item.cy);
                if (Math.abs(item.labelY - item.cy) > 0.5) {
                  ctx.lineTo(elbowX, item.labelY);
                }
                ctx.lineTo(textX, item.labelY);
              }
              ctx.stroke();

              ctx.beginPath();
              ctx.fillStyle = lineColor;
              ctx.arc(edgeX, item.cy, 1.4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = labelColor;
              ctx.textAlign = dir > 0 ? 'left' : 'right';
              ctx.textBaseline = 'middle';
              ctx.fillText(String(item.val), textX + dir * 6, item.labelY);
            });
          }
        });
      }

      ctx.restore();

      if (!opt.total) return;
      for (var idx = 0; idx < n; idx++) {
        var total = 0;
        var end = horiz ? -Infinity : Infinity;
        var px = 0;
        var py = 0;
        chart.data.datasets.forEach(function (ds, di) {
          if (!chart.isDatasetVisible(di)) return;
          total += num(ds.data[idx]);
          var bar = chart.getDatasetMeta(di).data[idx];
          if (!bar) return;
          var p = barProps(bar);
          if (horiz) {
            if (p.x > end) { end = p.x; py = p.y; }
          } else if (p.y < end) {
            end = p.y;
            px = p.x;
          }
        });
        if (total <= 0) continue;
        ctx.save();
        ctx.fillStyle = '#334155'; /* slate-700 */
        ctx.font = 'bold ' + CHART_UI.barTotalSize + 'px ' + CHART_FONT;
        if (horiz) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(total), end + 8, py);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(total), px, end - 4);
        }
        ctx.restore();
      }
    }
  };

  function applyHoverStyle(config) {
    (config.data && config.data.datasets || []).forEach(function (ds) {
      var bg = ds.backgroundColor;
      if (ds.hoverBackgroundColor == null) {
        if ($.isArray(bg)) {
          ds.hoverBackgroundColor = $.map(bg, function (c) { return darkenColor(c, 36); });
        } else if (typeof bg === 'string') {
          ds.hoverBackgroundColor = darkenColor(bg, 36);
        }
      }
      ds.hoverBorderWidth = 0;
      ds.borderWidth = 0;
      ds.hoverBorderColor = 'transparent';
      ds.borderColor = 'transparent';
    });
  }

  function fitCanvas(el) {
    var box = el.parentElement;
    if (!box) return;
    el.style.display = 'block';
    el.style.width = Math.max(box.clientWidth, 8) + 'px';
    el.style.height = Math.max(box.clientHeight, 8) + 'px';
  }

  function destroyChart(id) {
    if (charts[id]) {
      try { charts[id].destroy(); } catch (e) {}
      charts[id] = null;
    }
  }

  function createChart(id, config) {
    var el = document.getElementById(id);
    if (!el || typeof Chart === 'undefined') return null;

    destroyChart(id);
    fitCanvas(el);

    config.options = config.options || {};
    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    config.options.animation = $.extend(true, {
      duration: 900,
      easing: 'easeOutQuart',
      onComplete: function (ctx) {
        var c = ctx && ctx.chart;
        if (c) {
          c.$hrLabelsReady = true;
          c.draw();
        }
      }
    }, config.options.animation || {});

    applyHoverStyle(config);
    if (config.type === 'bar') {
      config.plugins = (config.plugins || []).concat([barCountPlugin]);
    }

    var chart = new Chart(el.getContext('2d'), config);
    chart.$hrLabelsReady = false;
    charts[id] = chart;
    return chart;
  }

  function gradeDatasets(gradeMap, labels, palette) {
    var colors = palette || GRADE_PALETTE;
    return GRADE_ORDER.map(function (name, i) {
      var data = gradeMap[name] || labels.map(function () { return 0; });
      return barGap({
        label: name,
        backgroundColor: colors[i % colors.length],
        data: data
      });
    });
  }

  function maxStackedTotal(datasets) {
    var max = 0;
    var len = (datasets[0] && datasets[0].data && datasets[0].data.length) || 0;
    for (var i = 0; i < len; i++) {
      var s = 0;
      for (var d = 0; d < datasets.length; d++) s += Math.abs(num(datasets[d].data[i]));
      if (s > max) max = s;
    }
    return Math.max(max, 1);
  }

  function stackedTooltipCallbacks() {
    return {
      title: function (items) { return items.length ? items[0].label : ''; },
      label: function (ctx) {
        var val = Math.abs(num(ctx.raw));
        var total = 0;
        ctx.chart.data.datasets.forEach(function (d) {
          total += Math.abs(num(d.data[ctx.dataIndex]));
        });
        var pct = total ? Math.round(val / total * 100) : 0;
        return (ctx.dataset.label || '') + ' ' + val + '명, ' + pct + '%';
      }
    };
  }

  /** 가로 누적 (직급 3개년 — 오른쪽 아래 대각선 콜아웃, 차트 영역 내) */
  function stackedHorizontal(canvasId, labels, datasets) {
    var xMax = maxStackedTotal(datasets);
    var ds = datasets.map(function (d) {
      return $.extend({}, d, {
        barPercentage: 0.62,
        categoryPercentage: 0.72
      });
    });
    createChart(canvasId, {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        indexAxis: 'y',
        layout: {
          padding: $.extend({}, CHART_UI.layout, {
            top: 22,
            right: 48,
            bottom: 36
          })
        },
        scales: {
          x: {
            stacked: true,
            min: 0,
            max: xMax * 1.18,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            ticks: { font: tickFont(), padding: CHART_UI.tickPad },
            grid: { display: false, drawTicks: false },
            border: AXIS_LINE
          }
        },
        plugins: {
          legend: legendOpts(),
          tooltip: { mode: 'nearest', intersect: true, callbacks: stackedTooltipCallbacks() },
          datalabels: { display: false },
          hrBarCount: {
            total: true,
            color: '#475569',
            callout: true,
            lineColor: '#cbd5e1',
            calloutStyle: 'diagonal'
          }
        }
      }
    });
  }

  /** 세로 누적 (본부별 — 오른쪽 위 대각선 콜아웃) */
  function stackedVertical(canvasId, labels, datasets) {
    var yMax = maxStackedTotal(datasets);
    var ds = datasets.map(function (d) {
      return $.extend({}, d, {
        barPercentage: 0.42,
        categoryPercentage: 0.62
      });
    });
    createChart(canvasId, {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        layout: {
          padding: $.extend({}, CHART_UI.layout, {
            top: 28,
            left: 16,
            right: 52
          })
        },
        scales: {
          x: {
            stacked: true,
            ticks: {
              font: tickFont(),
              padding: CHART_UI.tickPad,
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              align: 'center',
              crossAlign: 'center'
            },
            grid: { display: false, drawTicks: false },
            border: AXIS_LINE
          },
          y: {
            stacked: true,
            min: 0,
            max: yMax * 1.18,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        },
        plugins: {
          legend: legendOpts(),
          tooltip: { mode: 'nearest', intersect: true, callbacks: stackedTooltipCallbacks() },
          datalabels: { display: false },
          hrBarCount: {
            total: true,
            color: '#475569',
            callout: true,
            lineColor: '#cbd5e1',
            calloutStyle: 'diagonal'
          }
        }
      }
    });
  }

  function renderKpi(kpi) {
    $('#kpiWork').text(fmt(kpi.work));
    $('#cntIt').text(fmt(kpi.it));
    $('#cntCs').text(fmt(kpi.cs));
    $('#kpiLeave').text(fmt(kpi.leave));
    $('#kpiJoin').text(fmt(kpi.join));
    $('#kpiRetire').text(fmt(kpi.retire));
    $('#cntDisabil').text(fmt(kpi.disabil));
    $('#cntBohun').text(fmt(kpi.bohun));
    $('#cntForeign').text(fmt(kpi.foreign));
    renderItCsChart(kpi);
  }

  /** 재직자 IT/CS — 원형 솔리드(파이), 라벨·수치는 우측 텍스트 */
  function renderItCsChart(kpi) {
    var it = num(kpi.it);
    var cs = num(kpi.cs);
    var total = Math.max(it + cs, 1);
    createChart('chartItCs', {
      type: 'pie',
      data: {
        labels: ['IT', 'CS'],
        datasets: [{
          data: [it, cs],
          backgroundColor: [COLOR_IT, COLOR_CS],
          hoverBackgroundColor: [TW.skyHover, TW.orangeHover],
          borderWidth: 0
        }]
      },
      options: {
        layout: { padding: 0 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function () { return '재직자'; },
              label: function (ctx) {
                var val = num(ctx.raw);
                var pct = Math.round(val / total * 100);
                return (ctx.label || '') + ' ' + fmt(val) + '명 (' + pct + '%)';
              }
            }
          },
          datalabels: { display: false },
          hrBarCount: false
        },
        animation: { duration: 700, easing: 'easeOutQuart' }
      }
    });
  }

  function renderGender(g) {
    var tot = g.male + g.female;
    var mRate = tot ? Math.round(g.male / tot * 100) : 0;
    var fRate = tot ? 100 - mRate : 0;
    $('#cntMale').text(fmt(g.male) + '명');
    $('#rateMale').text('(' + mRate + '%)');
    $('#cntFemale').text(fmt(g.female) + '명');
    $('#rateFemale').text('(' + fRate + '%)');
  }

  function renderHqChart(data) {
    stackedVertical('chartHq', data.labels, gradeDatasets(data.grades, data.labels));
  }

  function renderGradeYearChart(data) {
    stackedHorizontal('chartGradeYear', data.labels, gradeDatasets(data.grades, data.labels));
  }

  /** 남(좌·음수) / 여(우·양수) 양방향 가로 막대 — 직책자·연령대 공통 */
  function renderBidirectionalGenderChart(canvasId, data, tooltipTitleFn) {
    var maxVal = 1;
    var mSum = 0;
    var fSum = 0;
    for (var i = 0; i < data.labels.length; i++) {
      var m = num(data.male[i]);
      var f = num(data.female[i]);
      maxVal = Math.max(maxVal, m, f);
      mSum += m;
      fSum += f;
    }
    var xPad = Math.ceil(maxVal * 1.15);
    createChart(canvasId, {
      type: 'bar',
      plugins: [{
        id: 'hrGenderSplit_' + canvasId,
        afterDraw: function (chart) {
          var xScale = chart.scales.x;
          var yScale = chart.scales.y;
          if (!xScale || !yScale) return;
          var x = xScale.getPixelForValue(0);
          var ctx = chart.ctx;
          ctx.save();
          ctx.strokeStyle = AXIS_LINE.color;
          ctx.lineWidth = AXIS_LINE.width;
          ctx.beginPath();
          ctx.moveTo(x, yScale.top);
          ctx.lineTo(x, yScale.bottom);
          ctx.stroke();
          ctx.restore();
        }
      }],
      data: {
        labels: data.labels,
        datasets: [
          barGap({
            label: '남',
            backgroundColor: COLOR_MALE,
            data: $.map(data.male, function (v) { return -num(v); })
          }),
          barGap({
            label: '여',
            backgroundColor: COLOR_FEMALE,
            data: data.female
          })
        ]
      },
      options: {
        indexAxis: 'y',
        layout: { padding: $.extend({}, CHART_UI.layout) },
        scales: {
          x: {
            stacked: true,
            min: -xPad,
            max: xPad,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          },
          y: {
            stacked: true,
            ticks: { font: tickFont(), padding: CHART_UI.tickPad },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        },
        plugins: {
          legend: legendOpts(),
          tooltip: {
            mode: 'nearest',
            intersect: true,
            callbacks: {
              title: function (items) {
                if (!items.length) return '';
                if (typeof tooltipTitleFn === 'function') return tooltipTitleFn(items[0].label);
                return items[0].label;
              },
              label: function (ctx) {
                var val = Math.abs(num(ctx.raw));
                var gender = ctx.dataset.label === '남' ? '남성' : '여성';
                return gender + ' ' + val + '명';
              }
            }
          },
          datalabels: { display: false },
          hrBarCount: { color: '#475569' }
        }
      }
    });
    return { male: mSum, female: fSum };
  }

  function renderJikchakChart(data) {
    var sums = renderBidirectionalGenderChart('chartJikchak', data);
    var tot = sums.male + sums.female;
    var mRate = tot ? Math.round(sums.male / tot * 100) : 0;
    var fRate = tot ? 100 - mRate : 0;
    $('#cntJikchakMale').text(fmt(sums.male) + '명');
    $('#rateJikchakMale').text('(' + mRate + '%)');
    $('#cntJikchakFemale').text(fmt(sums.female) + '명');
    $('#rateJikchakFemale').text('(' + fRate + '%)');
  }

  function renderAgeChart(data) {
    renderBidirectionalGenderChart('chartAge', data, function (lab) {
      return String(lab).indexOf('이상') >= 0 ? lab : lab + '세';
    });
  }

  function renderAll(data) {
    data = data || SAMPLE;
    renderKpi(data.kpi);
    renderGender(data.gender);
    renderHqChart(data.hq);
    renderJikchakChart(data.jikchak);
    renderGradeYearChart(data.gradeYear);
    renderAgeChart(data.age);
  }

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      $.each(charts, function (id, c) {
        if (!c) return;
        var el = document.getElementById(id);
        if (el) fitCanvas(el);
        try { c.resize(); } catch (e) {}
      });
    }, 120);
  }

  $(function () {
    /* dashboard01_ 만 다른 안 팔레트, dashboard01 은 기본 유지 */
    if (window.HR_GRADE_PALETTE === 'alt' || /dashboard01_/i.test(location.pathname || '')) {
      GRADE_PALETTE = GRADE_PALETTE_ALT;
    } else {
      GRADE_PALETTE = GRADE_PALETTE_DEFAULT;
    }
    if (window.Chart && window.ChartDataLabels) {
      Chart.register(ChartDataLabels);
    }
    if (window.Chart) {
      Chart.defaults.font.family = CHART_FONT;
      Chart.defaults.font.size = CHART_UI.tickSize;
    }
    renderAll(SAMPLE);
    $(window).on('resize', onResize);
  });

  window.HrDashboard = {
    render: renderAll,
    sample: SAMPLE
  };
})(window, jQuery);
