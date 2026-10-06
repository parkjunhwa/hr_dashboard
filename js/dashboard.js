/**
 * HR Dashboard — Chart.js 4.x
 * e-HR DashBoardTab01 차트 패턴 + 샘플 데이터(스크린샷 기준)
 *
 * WORK LOG
 * [2026-10-02] 초기 작성 — KPI / 본부·직책·직급3개년·연령피라미드
 * [2026-10-06] SAMPLE을 시안 스크린샷 명칭·수치로 교체 (차트 형태는 기존 유지)
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
  /** dashboard01_ 다른 안 — 사원·계약직 violet/fuchsia */
  var GRADE_PALETTE_ALT = [
    '#f87171', /* 임원 red-400 */
    '#fb923c', /* 부장 orange-400 */
    '#fbbf24', /* 차장 amber-400 */
    '#a3e635', /* 과장 lime-400 */
    '#34d399', /* 대리 emerald-400 */
    '#a78bfa', /* 사원 violet-400 */
    '#e879f9'  /* 계약직(무기) fuchsia-400 */
  ];
  var GRADE_PALETTE = GRADE_PALETTE_DEFAULT;
  var GRADE_ORDER = ['임원', '부장', '차장', '과장', '대리', '사원', '계약직(무기)'];
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
    barTotalSize: 15,
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

  /**
   * 시안 스크린샷 기준 샘플 데이터 (백엔드 연동 전 로컬 미리보기)
   * 본부·직책 명칭/수치, 직급 3개년·연령대는 시안과 동일
   */
  var SAMPLE = {
    kpi: { work: 945, it: 513, cs: 432, leave: 6, join: 37, retire: 39, disabil: 12, bohun: 0, foreign: 0 },
    gender: { male: 292, female: 179 },
    hq: {
      labels: [
        'ERP1사업본부', 'ERP2사업본부', 'ERP3사업본부', 'WRMS사업본부',
        '모빌리티사업본부', '클라우드사업본부', 'CIT사업본부', 'VC사업본부',
        '엔터프라이즈담당', 'CEO직속'
      ],
      /* 행 합계: 34, 42, 93, 92, 41, 43, 77, 10, 20, 19 */
      grades: {
        '임원': [1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
        '부장': [5, 11, 26, 25, 9, 4, 11, 3, 3, 2],
        '차장': [4, 4, 20, 14, 7, 3, 19, 6, 8, 5],
        '과장': [1, 3, 20, 17, 9, 8, 16, 0, 2, 3],
        '대리': [8, 8, 18, 17, 8, 15, 12, 0, 0, 2],
        '사원': [13, 13, 7, 15, 8, 10, 17, 0, 0, 2],
        '계약직(무기)': [2, 3, 1, 3, 0, 2, 2, 0, 7, 4]
      }
    },
    jikchak: {
      labels: ['본부장', '부본부장', '담당', '팀장', '센터장', '연구소장'],
      male: [7, 1, 3, 31, 2, 9],
      female: [1, 0, 3, 8, 0, 0]
    },
    gradeYear: {
      labels: ['2026', '2025', '2024'],
      /* 시안 수치 — 행 합계: 463, 338, 372 */
      grades: {
        '임원': [6, 5, 4],
        '부장': [91, 68, 73],
        '차장': [88, 58, 72],
        '과장': [77, 56, 57],
        '대리': [76, 60, 62],
        '사원': [100, 79, 86],
        '계약직(무기)': [25, 12, 18]
      }
    },
    age: {
      labels: ['50이상', '40~49', '30~39', '20~29'],
      /* 합계 남 292 / 여 179 — 시안: 81·91·99·21 / 13·54·67·45 */
      male: [81, 91, 99, 21],
      female: [13, 54, 67, 45]
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
   * opt.callout: 구간 수치를 선으로 밖으로 빼서 표시 (세로·가로 누적)
   * opt.calloutMaxValue: 절대 수치 이하만 콜아웃 (우선)
   * opt.calloutMaxRatio: 해당 막대 합 대비 이 비율 이하만 콜아웃 (calloutMaxValue 없을 때)
   * 직책자·성별연령: 막대 안 성별 수치 + 항목명 옆 총계(n) (총계는 barTotalSize bold)
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
      var calloutMaxValue = opt.calloutMaxValue != null ? Number(opt.calloutMaxValue) : null;
      var calloutMaxRatio = opt.calloutMaxRatio != null ? Number(opt.calloutMaxRatio) : null;
      var useAbsThreshold = calloutMaxValue != null && isFinite(calloutMaxValue);
      var useRatioThreshold = !useAbsThreshold && calloutMaxRatio != null && isFinite(calloutMaxRatio);
      var calloutsByIdx = {};
      var colTotals = null;

      if (calloutOn && useRatioThreshold) {
        colTotals = [];
        for (var ci = 0; ci < n; ci++) {
          var sum = 0;
          chart.data.datasets.forEach(function (ds, di) {
            if (!chart.isDatasetVisible(di)) return;
            sum += Math.abs(num(ds.data[ci]));
          });
          colTotals[ci] = sum;
        }
      }

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
            var useCallout = true;
            if (useAbsThreshold) {
              useCallout = val <= calloutMaxValue;
            } else if (useRatioThreshold && colTotals && colTotals[idx] > 0) {
              useCallout = val / colTotals[idx] <= calloutMaxRatio;
            }
            if (useCallout) {
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
            /* 임계값 초과 → 막대 안 표시로 진행 */
          }

          /* 막대 안: 흰색 */
          ctx.fillStyle = '#ffffff';
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

            /* 왼쪽부터 밀기 → 오른쪽에 안 들어가면 가용 폭에 균등 분배 (겹침 방지) */
            var prevLabelX = -Infinity;
            var overflow = false;
            list.forEach(function (item) {
              item.labelX = item.cx;
              var tw = ctx.measureText(String(item.val)).width + 4;
              if (item.labelX - prevLabelX < minGapX) {
                item.labelX = prevLabelX + minGapX;
              }
              if (item.labelX + tw / 2 > maxX) overflow = true;
              if (item.labelX < minX) item.labelX = minX;
              prevLabelX = item.labelX;
            });
            if (overflow && list.length > 1) {
              var span = Math.max(maxX - minX, minGapX);
              var step = span / (list.length - 1);
              list.forEach(function (item, i) {
                item.labelX = minX + step * i;
              });
            } else {
              list.forEach(function (item) {
                var tw = ctx.measureText(String(item.val)).width + 4;
                if (item.labelX + tw / 2 > maxX) item.labelX = maxX - tw / 2;
                if (item.labelX < minX) item.labelX = minX;
              });
            }

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
      /* 양방향(남 음수) 차트: 합은 절대값, 총원은 중앙선 오른쪽에 표시 */
      var xScale = chart.scales && chart.scales.x;
      var zeroX = (horiz && xScale) ? xScale.getPixelForValue(0) : null;
      for (var idx = 0; idx < n; idx++) {
        var total = 0;
        var end = horiz ? -Infinity : Infinity;
        var px = 0;
        var py = null;
        chart.data.datasets.forEach(function (ds, di) {
          if (!chart.isDatasetVisible(di)) return;
          total += Math.abs(num(ds.data[idx]));
          var bar = chart.getDatasetMeta(di).data[idx];
          if (!bar) return;
          var p = barProps(bar);
          if (horiz) {
            if (p.x > end) { end = p.x; py = p.y; }
            else if (py == null) py = p.y;
          } else if (p.y < end) {
            end = p.y;
            px = p.x;
          }
        });
        if (total <= 0 || (horiz && py == null)) continue;
        ctx.save();
        ctx.fillStyle = '#334155'; /* slate-700 */
        ctx.font = 'bold ' + CHART_UI.barTotalSize + 'px ' + CHART_FONT;
        if (horiz) {
          var tx = end;
          if (zeroX != null && tx < zeroX) tx = zeroX;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(total), tx + 8, py);
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

  /** 가로 누적 — 오른쪽 아래 대각선 콜아웃 (opt로 hrBarCount 덮어쓰기) */
  function stackedHorizontal(canvasId, labels, datasets, opt) {
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
          hrBarCount: $.extend({
            total: true,
            color: '#475569',
            callout: true,
            lineColor: '#cbd5e1',
            calloutStyle: 'diagonal'
          }, opt || {})
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
            calloutMaxValue: 15, /* 절대 수치 15 이하만 밖, 초과는 안 */
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
    /* 본부별 = 세로 누적 (20% 초과는 막대 안) */
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
    var rowTotals = [];
    for (var i = 0; i < data.labels.length; i++) {
      var m = num(data.male[i]);
      var f = num(data.female[i]);
      maxVal = Math.max(maxVal, m, f);
      mSum += m;
      fSum += f;
      rowTotals.push(m + f);
    }
    var xPad = Math.ceil(maxVal * 1.15);
    var tickColor = '#64748b'; /* slate-500 — 항목 라벨 */
    createChart(canvasId, {
      type: 'bar',
      plugins: [{
        id: 'hrGenderSplit_' + canvasId,
        afterDraw: function (chart) {
          var xScale = chart.scales.x;
          var yScale = chart.scales.y;
          if (!xScale || !yScale) return;
          var ctx = chart.ctx;
          var x0 = xScale.getPixelForValue(0);

          /* 중앙 분할선 */
          ctx.save();
          ctx.strokeStyle = AXIS_LINE.color;
          ctx.lineWidth = AXIS_LINE.width;
          ctx.beginPath();
          ctx.moveTo(x0, yScale.top);
          ctx.lineTo(x0, yScale.bottom);
          ctx.stroke();
          ctx.restore();

          /* 항목명(일반) + 총계(n)(#333 · 더 큰 bold) — 오른쪽 정렬 */
          var xEnd = chart.chartArea.left - CHART_UI.tickPad;
          ctx.save();
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          for (var ti = 0; ti < data.labels.length; ti++) {
            var py = yScale.getPixelForTick(ti);
            if (!isFinite(py)) continue;
            var totStr = '(' + rowTotals[ti] + ')';
            var lab = String(data.labels[ti]);

            ctx.fillStyle = '#333333';
            ctx.font = 'bold ' + CHART_UI.barTotalSize + 'px ' + CHART_FONT;
            var totW = ctx.measureText(totStr).width;
            ctx.fillText(totStr, xEnd, py);

            ctx.fillStyle = tickColor;
            ctx.font = '500 ' + CHART_UI.tickSize + 'px ' + CHART_FONT;
            ctx.fillText(lab + ' ', xEnd - totW, py);
          }
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
            /* 기본 tick 숨기고 afterDraw에서 항목+총계 직접 그림 — 폭만 확보 */
            afterFit: function (scale) {
              var ctx = scale.ctx || (scale.chart && scale.chart.ctx);
              if (!ctx) return;
              var maxW = 0;
              for (var i = 0; i < data.labels.length; i++) {
                ctx.font = '500 ' + CHART_UI.tickSize + 'px ' + CHART_FONT;
                var w = ctx.measureText(String(data.labels[i]) + ' ').width;
                ctx.font = 'bold ' + CHART_UI.barTotalSize + 'px ' + CHART_FONT;
                w += ctx.measureText('(' + rowTotals[i] + ')').width;
                if (w > maxW) maxW = w;
              }
              scale.width = Math.ceil(maxW + CHART_UI.tickPad);
            },
            ticks: {
              display: false,
              padding: CHART_UI.tickPad
            },
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
                var lab = items[0].label;
                if (typeof tooltipTitleFn === 'function') return tooltipTitleFn(lab);
                return lab;
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
    /* 직책자 = 성별&연령대와 동일 좌(남)·우(여) 양방향 */
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
    /* 페이지별 직급 팔레트 — 배열 지정 시 우선, dashboard01_ 는 alt */
    if (Array.isArray(window.HR_GRADE_PALETTE) && window.HR_GRADE_PALETTE.length) {
      GRADE_PALETTE = window.HR_GRADE_PALETTE.slice();
    } else if (window.HR_GRADE_PALETTE === 'alt' || /dashboard01_\.html/i.test(location.pathname || '')) {
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
