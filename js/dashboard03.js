/**
 * dashboard03 — 인재육성 및 조직문화
 * Chart.js 4.x · API: HrDashboard03
 * 상단 flex 1(교육시간 · 3개년 #8DBEF4 · 주제별 이수율) · 하단 flex 2(업무스타일 트리맵 간격 1px · 리더십)
 * 주제 도넛·업무스타일 회색은 퇴사 사유와 같은 값 큰 순 팔레트
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
    /* 트리맵 칸은 원본 이미지 배치. 색 있는 세 칸은 01·02 팔레트, 나머지는 회색 단계 */
    style: null,
    lead: {
      labels: ['소통', '혁신', '육성', '존경', '리더전반'],
      series: [
        { label: '2023', data: [3.65, 3.68, 3.66, 3.87, 3.70] },
        { label: '2024', data: [3.69, 3.62, 3.72, 3.96, 3.75] },
        { label: '2025', data: [3.81, 3.67, 3.77, 3.96, 3.81] }
      ]
    }
  };

  /* 원본 차트 박스 13,27–414,206 기준 칸 */
  var STYLE_RECTS = [
    { label: '전문가형', pct: 15, color: STYLE_MINT, x0: 13, y0: 27, x1: 122, y1: 121 },
    { label: '프로모터형', pct: 13, color: STYLE_BLUE, note: '팀 협력적이고, 사교적이고, 사람 중심적인', x0: 13, y0: 122, x1: 122, y1: 206 },
    { label: '이타주의지향', pct: 11, color: STYLE_PURPLE, x0: 123, y0: 27, x1: 204, y1: 126 },
    { label: '운영가형', pct: 9, x0: 123, y0: 127, x1: 204, y1: 206 },
    { label: '개인주의형', pct: 8, x0: 205, y0: 27, x1: 268, y1: 118 },
    { label: '협조가형', pct: 7, x0: 205, y0: 119, x1: 268, y1: 206 },
    { label: '장인형', pct: 7, x0: 270, y0: 27, x1: 358, y1: 82 },
    { label: '계획지향형', pct: 4, x0: 359, y0: 27, x1: 414, y1: 82 },
    { label: '설득가형', pct: 4, x0: 270, y0: 83, x1: 313, y1: 150 },
    { label: '가디언형', pct: 4, x0: 270, y0: 151, x1: 313, y1: 206 },
    { label: '지도자형', pct: 3, x0: 316, y0: 83, x1: 366, y1: 126 },
    { label: '적응형', pct: 3, x0: 368, y0: 83, x1: 414, y1: 126 },
    { label: '모험형', pct: 3, x0: 316, y0: 127, x1: 361, y1: 165 },
    { label: '학자형', pct: 3, x0: 316, y0: 166, x1: 361, y1: 206 },
    { label: '통제형', pct: 2, x0: 363, y0: 127, x1: 389, y1: 181 },
    { label: '분석형', pct: 2, x0: 391, y0: 127, x1: 414, y1: 181 },
    { label: '전략가형', pct: 2, x0: 363, y0: 182, x1: 414, y1: 206 }
  ];

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

  function snapStyleRects(rects) {
    var items = rects.map(function (r) {
      return { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, src: r };
    });
    var parent = [];
    function make() {
      parent.push(parent.length);
      return parent.length - 1;
    }
    function find(a) {
      while (parent[a] !== a) {
        parent[a] = parent[parent[a]];
        a = parent[a];
      }
      return a;
    }
    function union(a, b) {
      a = find(a);
      b = find(b);
      if (a !== b) parent[b] = a;
    }
    var xEdges = [];
    var yEdges = [];
    items.forEach(function (it) {
      it.ex0 = make();
      it.ex1 = make();
      it.ey0 = make();
      it.ey1 = make();
      xEdges.push({ id: it.ex0, v: it.x0, it: it, side: 'x0' });
      xEdges.push({ id: it.ex1, v: it.x1, it: it, side: 'x1' });
      yEdges.push({ id: it.ey0, v: it.y0, it: it, side: 'y0' });
      yEdges.push({ id: it.ey1, v: it.y1, it: it, side: 'y1' });
    });
    var tol = 4;
    items.forEach(function (a) {
      items.forEach(function (b) {
        if (a === b) return;
        if (b.x0 - a.x1 >= 0 && b.x0 - a.x1 <= tol && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 1) {
          union(a.ex1, b.ex0);
        }
        if (b.y0 - a.y1 >= 0 && b.y0 - a.y1 <= tol && Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 1) {
          union(a.ey1, b.ey0);
        }
      });
    });
    function apply(edges) {
      var groups = {};
      edges.forEach(function (e) {
        var g = find(e.id);
        if (!groups[g]) groups[g] = [];
        groups[g].push(e);
      });
      Object.keys(groups).forEach(function (g) {
        var sum = 0;
        groups[g].forEach(function (e) { sum += e.v; });
        var mid = sum / groups[g].length;
        groups[g].forEach(function (e) { e.it[e.side] = mid; });
      });
    }
    apply(xEdges);
    apply(yEdges);
    return items;
  }

  function styleItems() {
    var grays = STYLE_RECTS.filter(function (it) { return !it.color; });
    var last = Math.max(grays.length - 1, 1);
    var gi = 0;
    var snapped = snapStyleRects(STYLE_RECTS);
    var minX = snapped[0].x0;
    var minY = snapped[0].y0;
    var maxX = snapped[0].x1;
    var maxY = snapped[0].y1;
    snapped.forEach(function (it) {
      minX = Math.min(minX, it.x0);
      minY = Math.min(minY, it.y0);
      maxX = Math.max(maxX, it.x1);
      maxY = Math.max(maxY, it.y1);
    });
    var W = maxX - minX;
    var H = maxY - minY;
    return snapped.map(function (it) {
      var src = it.src;
      var color = src.color;
      if (!color) {
        color = mixHex(GRAY_DARK, GRAY_LIGHT, gi / last);
        gi += 1;
      }
      return {
        label: src.label,
        pct: src.pct,
        note: src.note || '',
        color: color,
        x: (it.x0 - minX) / W * 100,
        y: (it.y0 - minY) / H * 100,
        w: (it.x1 - it.x0) / W * 100,
        h: (it.y1 - it.y0) / H * 100
      };
    });
  }

  SAMPLE.style = styleItems();

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
          hoverOffset: 4
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
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    var y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return y > 0.82 ? '#2f3338' : '#ffffff';
  }

  function renderStyle(items) {
    var $map = $('#styleMap').empty();
    var $tip = $('<div class="hr-dash__style-tip"></div>').appendTo($map);
    (items || []).forEach(function (it) {
      var $cell = $('<div class="hr-dash__style-cell"></div>');
      if (it.w < 9) $cell.addClass('is-narrow');
      $cell.css({
        left: 'calc(' + it.x + '% + 0.5px)',
        top: 'calc(' + it.y + '% + 0.5px)',
        width: 'calc(' + it.w + '% - 1px)',
        height: 'calc(' + it.h + '% - 1px)',
        background: it.color,
        color: textOn(it.color)
      });
      $cell.attr('data-label', it.label + ', ' + it.pct + '%');
      $cell.attr('data-pct', it.pct);
      $cell.text(it.label + ', ' + it.pct + '%');
      $cell.on('mouseenter', function (e) {
        var lines = it.label + ', ' + it.pct + '%';
        if (it.note) lines += '<br>' + it.note;
        $tip.html(lines).show();
        placeTip(e);
      });
      $cell.on('mousemove', placeTip);
      $cell.on('mouseleave', function () { $tip.hide(); });
      $map.append($cell);
    });

    function placeTip(e) {
      var box = $map[0].getBoundingClientRect();
      var x = e.clientX - box.left + 12;
      var y = e.clientY - box.top + 14;
      var tw = $tip.outerWidth();
      var th = $tip.outerHeight();
      if (x + tw > box.width - 4) x = e.clientX - box.left - tw - 12;
      if (y + th > box.height - 4) y = e.clientY - box.top - th - 10;
      x = Math.max(4, x);
      y = Math.max(4, y);
      $tip.css({ left: x, top: y });
    }
    fitStyleLabels();
  }

  function fitStyleLabels() {
    $('#styleMap .hr-dash__style-cell').each(function () {
      var el = this;
      el.textContent = el.getAttribute('data-label');
      el.classList.toggle('is-narrow', el.clientWidth < 78);
      if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) {
        el.textContent = el.getAttribute('data-pct') + '%';
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
    fitStyleLabels();
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
