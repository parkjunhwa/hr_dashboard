/**
 * dashboard03 — 인재육성 및 조직문화
 * Chart.js 4.x · chartjs-chart-treemap · API: HrDashboard03
 * 상단 flex 1(교육시간 · 3개년 #8DBEF4 · 주제별 이수율) · 하단 flex 2(업무스타일 트리맵 · 리더십)
 * 주제 도넛·업무스타일 회색은 퇴사 사유와 같은 값 큰 순 팔레트
 * 업무스타일: Chart.js treemap — pct 변경 시 칸 면적 자동 재계산
 * 3개년·리더십 값은 막대 위 15px bold. 리더십은 소수 둘째 자리
 * 주제 도넛 지름은 영역보다 20px 작음. 툴팁은 「이름, n%」 한 줄, 시간이 있으면 (n시간)
 * 1100px 이하 교육시간 카드는 두 블록이 줄지 않고 내용 높이만큼 늘어남
 */
(function (window, $) {
  'use strict';

  var CHART_FONT = '"Pretendard GOV", "Malgun Gothic", sans-serif';
  var BAR_COLOR = '#8DBEF4';
  var LEAD_COLORS = ['#C6CAD1', '#A8B0B9', '#8DBEF4'];
  var STYLE_MINT = '#99D5BD';
  var STYLE_BLUE = '#8DBEF4';
  var STYLE_PURPLE = '#C0B3EE';
  var GRAY_DARK = '#A8B0B9';
  var GRAY_LIGHT = '#F3F4F6';
  /* 값이 큰 순서 — dashboard02 퇴사 사유와 동일 */
  var TOPIC_COLORS = [
    '#99D5BD',
    '#8DBEF4',
    '#C0B3EE',
    '#ECC1ED',
    '#F7E190',
    '#A8B0B9',
    '#C6CAD1'
  ];
  var charts = {};

  var SAMPLE = {
    hours: { total: 51560, per: 103 },
    year: {
      labels: ['2024', '2025', '2026'],
      data: [33, 80, 103]
    },
    topic: [
      { label: 'IT개발 및 인프라', pct: 40, hours: 46332 },
      { label: 'AI', pct: 21 },
      { label: '업무공통 및 소프트스킬', pct: 17 },
      { label: '리더십 및 인사조직관리', pct: 8 },
      { label: '법령의무', pct: 6 },
      { label: '자격증', pct: 5 },
      { label: '기타', pct: 3 }
    ],
    /* 업무스타일: label · pct(면적) · note(툴팁 선택) — 값만 바꾸면 트리맵 재배치 */
    style: [
      { label: '전문가형', pct: 15 },
      { label: '프로모터형', pct: 13, note: '팀 협력적이고, 사교적이고, 사람 중심적인' },
      { label: '이타주의지향', pct: 11 },
      { label: '운영가형', pct: 9 },
      { label: '개인주의형', pct: 8 },
      { label: '협조가형', pct: 7 },
      { label: '장인형', pct: 7 },
      { label: '계획지향형', pct: 4 },
      { label: '설득가형', pct: 4 },
      { label: '가디언형', pct: 4 },
      { label: '지도자형', pct: 3 },
      { label: '적응형', pct: 3 },
      { label: '모험형', pct: 3 },
      { label: '학자형', pct: 3 },
      { label: '통제형', pct: 2 },
      { label: '분석형', pct: 2 },
      { label: '전략가형', pct: 2 }
    ],
    lead: {
      labels: ['소통', '혁신', '육성', '존경', '리더전반'],
      series: [
        { label: '2023', data: [3.65, 3.68, 3.66, 3.87, 3.70] },
        { label: '2024', data: [3.69, 3.62, 3.72, 3.96, 3.75] },
        { label: '2025', data: [3.81, 3.67, 3.77, 3.96, 3.81] }
      ]
    }
  };

  function mixHex(a, b, t) {
    function part(hex) {
      return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16)
      ];
    }
    var A = part(a);
    var B = part(b);
    var c = A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); });
    return '#' + c.map(function (v) {
      var s = v.toString(16);
      return s.length < 2 ? '0' + s : s;
    }).join('');
  }

  function fmt(n) {
    var v = Math.round(Number(n) || 0);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

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

  var barCountPlugin = {
    id: 'd03BarCount',
    afterDatasetsDraw: function (chart) {
      if (!chart.$d03LabelsReady) return;
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        if (!chart.isDatasetVisible(di)) return;
        var meta = chart.getDatasetMeta(di);
        (meta.data || []).forEach(function (bar, idx) {
          var val = Number(ds.data[idx]) || 0;
          if (val <= 0 || !bar) return;
          var decimal = chart.$d03LabelMode === 'decimal';
          ctx.save();
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 15px ' + CHART_FONT;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          var text = decimal ? val.toFixed(2) : String(Math.round(val));
          ctx.fillText(text, bar.x, bar.y - 4);
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
          ctx.chart.$d03LabelsReady = true;
          ctx.chart.draw();
        }
      }
    }, config.options.animation || {});
    var labelMode = config.labelMode || 'int';
    delete config.labelMode;
    if (config.type === 'bar') {
      config.plugins = (config.plugins || []).concat([barCountPlugin]);
    }
    var chart = new Chart(el.getContext('2d'), config);
    chart.$d03LabelMode = labelMode;
    chart.$d03LabelsReady = false;
    charts[id] = chart;
    return chart;
  }

  function renderHours(d) {
    $('#eduTotal').text(fmt(d.total));
    $('#eduPer').text(fmt(d.per));
  }

  function renderYear(d) {
    var max = 1;
    (d.data || []).forEach(function (v) { max = Math.max(max, Number(v) || 0); });
    max = max * 1.28;
    createChart('chart03Year', {
      type: 'bar',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: BAR_COLOR,
          borderWidth: 0,
          barPercentage: 0.62,
          categoryPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18, right: 8, bottom: 4, left: 4 } },
        plugins: {
          legend: { display: false },
          datalabels: { display: false }
        },
        scales: {
          x: {
            ticks: {
              font: { size: 13, family: CHART_FONT, weight: '500' },
              color: '#64748b',
              maxRotation: 0,
              autoSkip: false
            },
            grid: { display: false, drawTicks: false },
            border: { display: true, color: '#e2e8f0' }
          },
          y: {
            min: 0,
            max: max,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        }
      }
    });
  }

  function renderTopic(items) {
    var list = items || [];
    var $leg = $('#topicLegend').empty();
    var labels = [];
    var values = [];
    var hours = [];
    var colors = [];
    list.forEach(function (it, i) {
      labels.push(it.label);
      values.push(it.pct);
      hours.push(it.hours || 0);
      colors.push(TOPIC_COLORS[i] || TOPIC_COLORS[TOPIC_COLORS.length - 1]);
      $leg.append(
        '<div class="item">' +
          '<span class="dot" style="background:' + colors[i] + '"></span>' +
          '<span class="name">' + it.label + '</span>' +
        '</div>'
      );
    });

    createChart('chart03Topic', {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          hours: hours,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: function () { return ''; },
              label: function (ctx) {
                var hrs = ctx.dataset.hours && ctx.dataset.hours[ctx.dataIndex];
                var text = (ctx.label || '') + ', ' + ctx.raw + '%';
                if (hrs) text += ' (' + fmt(hrs) + '시간)';
                return text;
              }
            }
          }
        }
      }
    });
  }

  function textOn(hex) {
    if (!hex || hex.charAt(0) !== '#' || hex.length < 7) return '#2f3338';
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return y > 0.82 ? '#2f3338' : '#ffffff';
  }

  /** 값 큰 순: 1~3위 mint/blue/purple · 나머지 회색 단계 */
  function styleColorMap(items) {
    var sorted = (items || []).slice().sort(function (a, b) {
      return (Number(b.pct) || 0) - (Number(a.pct) || 0);
    });
    var map = {};
    var grayN = Math.max(sorted.length - 3, 1);
    sorted.forEach(function (it, i) {
      if (i === 0) map[it.label] = STYLE_MINT;
      else if (i === 1) map[it.label] = STYLE_BLUE;
      else if (i === 2) map[it.label] = STYLE_PURPLE;
      else map[it.label] = mixHex(GRAY_DARK, GRAY_LIGHT, (i - 3) / grayN);
    });
    return map;
  }

  function renderStyle(items) {
    var list = (items || []).filter(function (it) {
      return it && it.label && (Number(it.pct) || 0) > 0;
    });
    var colors = styleColorMap(list);
    var notes = {};
    var tree = list.map(function (it) {
      notes[it.label] = it.note || '';
      return {
        label: it.label,
        value: Number(it.pct) || 0,
        note: it.note || ''
      };
    });

    createChart('chart03Style', {
      type: 'treemap',
      data: {
        datasets: [{
          tree: tree,
          key: 'value',
          groups: ['label'],
          spacing: 1,
          borderWidth: 0,
          backgroundColor: function (ctx) {
            if (ctx.type !== 'data' || !ctx.raw || ctx.raw.g == null) return 'transparent';
            return colors[ctx.raw.g] || GRAY_DARK;
          },
          captions: { display: false },
          labels: {
            display: true,
            align: 'left',
            position: 'bottom',
            padding: 6,
            overflow: 'fit',
            color: function (ctx) {
              if (ctx.type !== 'data' || !ctx.raw || ctx.raw.g == null) return '#fff';
              return textOn(colors[ctx.raw.g] || GRAY_DARK);
            },
            font: {
              size: 12,
              weight: '700',
              family: CHART_FONT
            },
            formatter: function (ctx) {
              if (ctx.type !== 'data' || !ctx.raw || ctx.raw.g == null) return '';
              var area = (ctx.raw.w || 0) * (ctx.raw.h || 0);
              if (area < 2800) return String(ctx.raw.v) + '%';
              return ctx.raw.g + ', ' + ctx.raw.v + '%';
            }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 0 },
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: function () { return ''; },
              label: function (ctx) {
                var raw = ctx.raw || {};
                var name = raw.g || '';
                var lines = [name + ', ' + raw.v + '%'];
                if (notes[name]) lines.push(notes[name]);
                return lines;
              }
            }
          }
        }
      }
    });
  }

  function renderLead(d) {
    var sets = (d.series || []).map(function (s, i) {
      return {
        label: s.label,
        data: s.data,
        backgroundColor: LEAD_COLORS[i] || LEAD_COLORS[LEAD_COLORS.length - 1],
        borderWidth: 0,
        barPercentage: 0.85,
        categoryPercentage: 0.55
      };
    });
    createChart('chart03Lead', {
      type: 'bar',
      labelMode: 'decimal',
      data: { labels: d.labels, datasets: sets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18, right: 8, bottom: 4, left: 4 } },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 14,
              color: '#64748b',
              font: { size: 13, family: CHART_FONT, weight: '600' }
            }
          },
          datalabels: { display: false }
        },
        scales: {
          x: {
            ticks: {
              font: { size: 13, family: CHART_FONT, weight: '500' },
              color: '#64748b',
              maxRotation: 0,
              autoSkip: false
            },
            grid: { display: false, drawTicks: false },
            border: { display: true, color: '#e2e8f0' }
          },
          y: {
            min: 3.4,
            max: 4.28,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        }
      }
    });
  }

  function renderAll(data) {
    data = data || SAMPLE;
    renderHours(data.hours);
    renderYear(data.year);
    renderTopic(data.topic);
    renderStyle(data.style || SAMPLE.style);
    renderLead(data.lead);
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
    if (window.Chart) {
      Chart.defaults.font.family = CHART_FONT;
      Chart.defaults.font.size = 13;
    }
    renderAll(SAMPLE);
    requestAnimationFrame(function () {
      requestAnimationFrame(resizeAllCharts);
    });
    $(window).on('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeAllCharts, 120);
    });
  });

  window.HrDashboard03 = { render: renderAll, sample: SAMPLE };
})(window, jQuery);
