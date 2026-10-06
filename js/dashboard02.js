/**
 * dashboard02 — 인력확보 및 유지
 * Chart.js 4.x + 샘플 데이터 (첨부 시안 기준)
 */
(function (window, $) {
  'use strict';

  var CHART_FONT = '"Pretendard GOV", "Malgun Gothic", sans-serif';
  /* Tailwind 400 계열 참조 */
  var ACCENT_A = '#60a5fa'; /* blue-400 */
  var ACCENT_B = '#fb923c'; /* orange-400 */
  var ACCENT_C = '#f472b6'; /* pink-400 */
  var MUTED = '#e2e8f0';    /* slate-200 (잔여) */
  var SERIES = [
    '#f87171', /* red-400 */
    '#fb923c', /* orange-400 */
    '#fbbf24', /* amber-400 */
    '#a3e635', /* lime-400 */
    '#34d399', /* emerald-400 */
    '#22d3ee', /* cyan-400 */
    '#38bdf8', /* sky-400 */
    '#818cf8', /* indigo-400 */
    '#a78bfa', /* violet-400 */
    '#e879f9'  /* fuchsia-400 */
  ];
  var REASON_COLORS = [
    '#60a5fa', /* blue-400 */
    '#fb923c', /* orange-400 */
    '#fbbf24', /* amber-400 */
    '#34d399', /* emerald-400 */
    '#a78bfa'  /* violet-400 */
  ];
  var charts = {};

  var SAMPLE = {
    hire: {
      labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      newbie: [0, 10, 11, 2, 2, 0, 0, 0, 0, 0, 0, 0],
      career: [1, 4, 2, 4, 1, 0, 1, 2, 0, 0, 0, 0]
    },
    core: {
      labels: ['BRP1', 'BRP2', 'BRP3', 'WRMS', '모빌리티', '클라우드', 'DT', 'VC', '엔터프라이즈', 'CEO직속'],
      data: [7, 2, 10, 5, 4, 8, 1, 1, 3, 12]
    },
    successor: {
      labels: ['BRP1', 'BRP2', 'BRP3', 'WRMS', '모빌리티', '클라우드', 'DT', 'VC', '엔터프라이즈', '경영지원'],
      external: [3, 1, 1, 0, 2, 2, 1, 1, 3, 1],
      internal: [2, 2, 6, 1, 3, 2, 1, 2, 3, 2]
    },
    retireRate: { rate: 5, count: 21 },
    gradeRetire: {
      labels: ['임원', '부장', '차장', '과장', '대리', '사원', '연구', '무기계약'],
      data: [2, 4, 2, 4, 9, 6, 3, 1]
    },
    reason: {
      center: '2026년 9월',
      items: [
        { pct: 36, label: '[개인사정] 가정사 질병 및 개인 경력개발' },
        { pct: 21, label: '[직무관계] 부적응' },
        { pct: 14, label: '[개인사정] 결혼 출산 및 육아' },
        { pct: 14, label: '[직무관계] 업무 스트레스 과다' },
        { pct: 14, label: '[개인사정] 학업/취업준비' }
      ]
    },
    deptRetire: {
      labels: ['BRP1', 'BRP2', 'BRP3', 'WRMS', '모빌리티', '클라우드', 'DT', '엔터프라이즈', 'CEO직속'],
      data: [6, 1, 2, 2, 1, 4, 6, 1, 3]
    },
    tenureRetire: {
      labels: ['1년미만', '1~3년', '3~5년', '5~10년', '10~20년', '20년이상'],
      data: [10, 5, 2, 1, 1, 1]
    }
  };

  function destroyChart(id) {
    if (charts[id]) {
      try { charts[id].destroy(); } catch (e) {}
      charts[id] = null;
    }
  }

  function fitCanvas(el) {
    var box = el.parentElement;
    if (!box) return;
    el.style.display = 'block';
    el.style.width = Math.max(box.clientWidth, 8) + 'px';
    el.style.height = Math.max(box.clientHeight, 8) + 'px';
  }

  function baseBarOpts() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 18, right: 8, bottom: 4, left: 4 } },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { font: { size: 12, family: CHART_FONT }, boxWidth: 12, padding: 14 }
        },
        datalabels: { display: false }
      }
    };
  }

  var barCountPlugin = {
    id: 'd02BarCount',
    afterDatasetsDraw: function (chart) {
      if (!chart.$labelsReady) return;
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        if (!chart.isDatasetVisible(di)) return;
        var meta = chart.getDatasetMeta(di);
        (meta.data || []).forEach(function (bar, idx) {
          var val = Number(ds.data[idx]) || 0;
          if (val <= 0 || !bar) return;
          ctx.save();
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 15px ' + CHART_FONT;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(val), bar.x, bar.y - 4);
          ctx.restore();
        });
      });
    }
  };

  function createChart(id, config) {
    var el = document.getElementById(id);
    if (!el || typeof Chart === 'undefined') return null;
    destroyChart(id);
    fitCanvas(el);
    config.options = config.options || {};
    config.options.animation = $.extend(true, {
      duration: 700,
      onComplete: function (ctx) {
        if (ctx && ctx.chart) {
          ctx.chart.$labelsReady = true;
          ctx.chart.draw();
        }
      }
    }, config.options.animation || {});
    if (config.type === 'bar') {
      config.plugins = (config.plugins || []).concat([barCountPlugin]);
    }
    var chart = new Chart(el.getContext('2d'), config);
    chart.$labelsReady = false;
    charts[id] = chart;
    return chart;
  }

  function categoryAxis() {
    return {
      ticks: {
        font: { size: 11, family: CHART_FONT },
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
        padding: 10
      },
      grid: { display: false, drawTicks: false },
      border: { display: true, color: '#e2e8f0' }
    };
  }

  function valueAxis(max) {
    return {
      min: 0,
      max: max,
      ticks: { display: false },
      grid: { display: false, drawTicks: false },
      border: { display: false }
    };
  }

  function maxOf() {
    var m = 1;
    for (var i = 0; i < arguments.length; i++) {
      var arr = arguments[i];
      for (var j = 0; j < arr.length; j++) m = Math.max(m, Number(arr[j]) || 0);
    }
    return m;
  }

  function renderHire(d) {
    var max = maxOf(d.newbie, d.career) * 1.25;
    var opts = baseBarOpts();
    createChart('chartHire', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [
          { label: '신입', data: d.newbie, backgroundColor: ACCENT_A, borderWidth: 0, barPercentage: 0.7, categoryPercentage: 0.7 },
          { label: '경력', data: d.career, backgroundColor: ACCENT_B, borderWidth: 0, barPercentage: 0.7, categoryPercentage: 0.7 }
        ]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderCore(d) {
    var max = maxOf(d.data) * 1.25;
    var opts = baseBarOpts();
    opts.plugins.legend.display = false;
    createChart('chartCore', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: SERIES.slice(0, d.labels.length),
          borderWidth: 0,
          barPercentage: 0.65,
          categoryPercentage: 0.75
        }]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderSuccessor(d) {
    var max = 0;
    for (var i = 0; i < d.labels.length; i++) {
      max = Math.max(max, (d.external[i] || 0) + (d.internal[i] || 0), d.external[i] || 0, d.internal[i] || 0);
    }
    max = Math.max(max, 1) * 1.25;
    var opts = baseBarOpts();
    createChart('chartSuccessor', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [
          { label: '외부후보자', data: d.external, backgroundColor: ACCENT_A, borderWidth: 0, barPercentage: 0.7, categoryPercentage: 0.7 },
          { label: '팀원우수', data: d.internal, backgroundColor: ACCENT_C, borderWidth: 0, barPercentage: 0.7, categoryPercentage: 0.7 }
        ]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderRetireRate(d) {
    $('#retireRateText').html(
      d.rate + '% <span class="hr-dash__rate-sub">(' + d.count + '명)</span>'
    );
    var opts = baseBarOpts();
    opts.plugins.legend.display = false;
    opts.layout.padding = 4;
    createChart('chartRetireRate', {
      type: 'pie',
      data: {
        labels: ['퇴직', '잔여'],
        datasets: [{
          data: [d.rate, Math.max(100 - d.rate, 0)],
          backgroundColor: ['#f87171', MUTED], /* red-400 + 잔여 */
          borderWidth: 0
        }]
      },
      options: $.extend(true, opts, {
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ' ' + ctx.raw + '%';
              }
            }
          }
        }
      })
    });
  }

  /** 직급별 퇴직 — Tailwind 400 풀에서 중복 없이 랜덤 배정 */
  function randomSeriesColors(n) {
    var pool = SERIES.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    var out = [];
    for (var k = 0; k < n; k++) {
      out.push(pool[k % pool.length]);
    }
    return out;
  }

  function renderGradeRetire(d) {
    var max = maxOf(d.data) * 1.3;
    var opts = baseBarOpts();
    opts.plugins.legend.display = false;
    createChart('chartGradeRetire', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: randomSeriesColors(d.labels.length),
          borderWidth: 0,
          barPercentage: 0.6,
          categoryPercentage: 0.75
        }]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderReason(d) {
    var $leg = $('#reasonLegend').empty();
    var values = [];
    var labels = [];
    d.items.forEach(function (it, i) {
      values.push(it.pct);
      labels.push(it.label);
      $leg.append(
        '<div class="item">' +
          '<span class="dot" style="background:' + REASON_COLORS[i % REASON_COLORS.length] + '"></span>' +
          '<span class="pct">' + it.pct + '%</span>' +
          '<span>' + it.label + '</span>' +
        '</div>'
      );
    });

    var centerPlugin = {
      id: 'd02ReasonCenter',
      afterDraw: function (chart) {
        var meta = chart.getDatasetMeta(0);
        if (!meta || !meta.data || !meta.data.length) return;
        var cx = meta.data[0].x;
        var cy = meta.data[0].y;
        var ctx = chart.ctx;
        /* 모바일(≤1100): 조금 작게 */
        var fontSize = window.matchMedia('(max-width: 1100px)').matches ? 14 : 22;
        ctx.save();
        ctx.fillStyle = '#334155';
        ctx.font = 'bold ' + fontSize + 'px ' + CHART_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.center, cx, cy);
        ctx.restore();
      }
    };

    createChart('chartReason', {
      type: 'doughnut',
      plugins: [centerPlugin],
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: REASON_COLORS.slice(0, values.length),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ' ' + ctx.raw + '%';
              }
            }
          }
        }
      }
    });
  }

  function renderDeptRetire(d) {
    var max = maxOf(d.data) * 1.3;
    var opts = baseBarOpts();
    opts.plugins.legend.display = false;
    createChart('chartDeptRetire', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: SERIES.slice(0, d.labels.length),
          borderWidth: 0,
          barPercentage: 0.65,
          categoryPercentage: 0.75
        }]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderTenureRetire(d) {
    var max = maxOf(d.data) * 1.25;
    var opts = baseBarOpts();
    opts.plugins.legend.display = false;
    createChart('chartTenureRetire', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: SERIES.slice(0, d.labels.length),
          borderWidth: 0,
          barPercentage: 0.55,
          categoryPercentage: 0.75
        }]
      },
      options: $.extend(true, opts, {
        scales: { x: categoryAxis(), y: valueAxis(max) }
      })
    });
  }

  function renderAll(data) {
    data = data || SAMPLE;
    renderHire(data.hire);
    renderCore(data.core);
    renderSuccessor(data.successor);
    renderRetireRate(data.retireRate);
    renderGradeRetire(data.gradeRetire);
    renderReason(data.reason);
    renderDeptRetire(data.deptRetire);
    renderTenureRetire(data.tenureRetire);
  }

  function resizeAllCharts() {
    $.each(charts, function (id, c) {
      if (!c) return;
      var el = document.getElementById(id);
      if (el) fitCanvas(el);
      try { c.resize(); } catch (e) {}
    });
  }

  var resizeTimer = null;
  $(function () {
    if (window.Chart && window.ChartDataLabels) Chart.register(ChartDataLabels);
    if (window.Chart) Chart.defaults.font.family = CHART_FONT;
    renderAll(SAMPLE);
    /* 그리드 레이아웃 확정 후 도넛 등 크기 재계산 */
    requestAnimationFrame(function () {
      requestAnimationFrame(resizeAllCharts);
    });
    $(window).on('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeAllCharts, 120);
    });
  });

  window.HrDashboard02 = { render: renderAll, sample: SAMPLE };
})(window, jQuery);
