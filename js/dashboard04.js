/**
 * dashboard04 — 조직건강 및 리스크 관리
 * Chart.js 4.x · API: HrDashboard04
 * 색: 본사·수검 #8DBEF4 · 콜센터·미수검 #669BE2 · 수료 #C6CAD1 · 미수료 #F7E190
 * 범례: 13px · weight 600 · #666 · 색 칸 14px · 우측 상단 (dashboard01과 동일)
 * 안전교육 범례는 수료·미수료 한 번
 * 건강검진: 10% 초과는 막대 안 흰색 15px, 10% 이하는 오른쪽 선 콜아웃
 * 건강검진 범례는 콜아웃 여백과 따로, 다른 카드와 같은 오른쪽 끝 (d04LegendEnd)
 * 안전교육 도넛 지름은 칸보다 20px 작음. % 라벨만 chartjs-plugin-datalabels
 * 안전교육 툴팁은 HTML. 가운데 「상반기」「하반기」 글자 위, 항목 좌우 14px
 * 툴팁 제목은 상반기·하반기, 아래는 색 칸과 수료·미수료 값
 * 사내 고충 표: 넓은 화면은 남는 높이를 채우고, 부족하면 thead·tfoot 고정, tbody 스크롤.
 * 1100px 이하에서는 스크롤 없이 카드 높이가 표 내용만큼 늘어남.
 */
(function (window, $) {
  'use strict';

  var CHART_FONT = '"Pretendard GOV", "Malgun Gothic", sans-serif';
  var BLUE = '#8DBEF4';
  var BLUE_DARK = '#669BE2';
  var GRAY = '#C6CAD1';
  var YELLOW = '#F7E190';
  var charts = {};

  var SAMPLE = {
    accident: {
      labels: ['상해/질병', '사망'],
      series: [
        { label: '본사', color: BLUE, data: [2, 0] },
        { label: '콜센터', color: BLUE_DARK, data: [1, 0] }
      ]
    },
    safety: [
      { id: 'chart04Safe1', done: 98.9, miss: 1.1 },
      { id: 'chart04Safe2', done: 100, miss: 0 }
    ],
    checkup: {
      labels: ['본사', '콜센터'],
      done: [98.6, 99.0],
      miss: [1.4, 1.0]
    },
    grievance: {
      years: ['2023년', '2024년', '2025년'],
      rows: [
        {
          group: '윤리/준법위반',
          detail: '부정청탁, 금품/향응 수수, 부당예산 집행, 불공정거래행위, 내부정보 유출, 정보보안 위반 등 법령 및 사규 위반 행위',
          cells: [0, 0, 1, 1, 2, 0]
        },
        {
          group: '갑질 및 직장 내 괴롭힘',
          detail: '직장 내 우월적 지위를 이용한 부당한 지시, 정신적/육체적 압박 및 불안감 조성 행위, 부조리 관련 행위',
          cells: [0, 0, 4, 4, 1, 0]
        },
        {
          group: '성희롱 및 인권침해',
          detail: '직장 내 성희롱/성차별 등 인권을 침해하는 행위',
          cells: [2, 2, 1, 1, 3, 2]
        },
        {
          group: '인사운영',
          detail: '평가·보상·승진·배치 등 인사제도 관련 고충 및 인사권 남용 행위',
          cells: [0, 0, 1, 1, 2, 2]
        },
        {
          group: '근무환경',
          detail: '업무과중, 근무시간, 근태, 복지제도, 조직 내 갈등, 안전보건(건강관리, 직무스트레스 등) 관련 고충',
          cells: [1, 1, 0, 0, 0, 0]
        },
        {
          group: '기타',
          detail: '위 분류에 해당하지 않는 모든 고충 및 행위',
          cells: [1, 1, 0, 0, 0, 0]
        }
      ]
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
          ctx.chart.$d04Ready = true;
          ctx.chart.draw();
        }
      }
    }, config.options.animation || {});
    var chart = new Chart(el.getContext('2d'), config);
    chart.$d04Ready = false;
    charts[id] = chart;
    return chart;
  }

  var countPlugin = {
    id: 'd04BarCount',
    afterDatasetsDraw: function (chart) {
      if (!chart.$d04Ready || chart.config.type !== 'bar') return;
      var ctx = chart.ctx;
      var stacked = chart.options.scales && chart.options.scales.y && chart.options.scales.y.stacked;
      chart.data.datasets.forEach(function (ds, di) {
        if (!chart.isDatasetVisible(di)) return;
        var meta = chart.getDatasetMeta(di);
        (meta.data || []).forEach(function (bar, idx) {
          var val = Number(ds.data[idx]);
          if (!bar || isNaN(val)) return;
          ctx.save();
          ctx.font = 'bold 15px ' + CHART_FONT;
          if (stacked) {
            var text = val.toFixed(1) + '%';
            var midY = (bar.y + bar.base) / 2;
            var halfW = (bar.width || 24) / 2;
            if (val <= 10) {
              var edgeX = bar.x + halfW;
              var arm = 14;
              ctx.strokeStyle = '#cbd5e1';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(edgeX, midY);
              ctx.lineTo(edgeX + arm, midY);
              ctx.stroke();
              ctx.beginPath();
              ctx.fillStyle = '#cbd5e1';
              ctx.arc(edgeX, midY, 1.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#475569';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, edgeX + arm + 4, midY);
            } else {
              ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(text, bar.x, midY);
            }
          } else {
            ctx.fillStyle = '#475569';
            ctx.textBaseline = 'bottom';
            ctx.fillText(String(val), bar.x, bar.y - 4);
          }
          ctx.restore();
        });
      });
    }
  };

  function topLegend() {
    return {
      display: true,
      position: 'top',
      align: 'end',
      labels: {
        boxWidth: 14,
        boxHeight: 14,
        padding: 12,
        color: '#666',
        font: { size: 13, family: CHART_FONT, weight: '600' }
      }
    };
  }

  function axisFont() {
    return {
      ticks: {
        font: { size: 13, family: CHART_FONT, weight: '500' },
        color: '#64748b',
        maxRotation: 0,
        autoSkip: false
      },
      grid: { display: false, drawTicks: false },
      border: { display: true, color: '#e2e8f0' }
    };
  }

  function renderAccident(d) {
    createChart('chart04Accident', {
      type: 'bar',
      plugins: [countPlugin],
      data: {
        labels: d.labels,
        datasets: (d.series || []).map(function (s) {
          return {
            label: s.label,
            data: s.data,
            backgroundColor: s.color,
            borderWidth: 0,
            barPercentage: 0.85,
            categoryPercentage: 0.55
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18, right: 8, bottom: 0, left: 4 } },
        plugins: {
          legend: topLegend(),
          datalabels: { display: false }
        },
        scales: {
          x: axisFont(),
          y: {
            min: 0,
            max: 3,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        }
      }
    });
  }

  function pctText(n) {
    return (Math.round(n * 10) / 10).toFixed(1) + '%';
  }

  /* 캔버스 툴팁은 가운데 글자보다 아래에 그려지므로 HTML로 글자 위에 띄운다.
     항목 클래스는 line. AdminLTE .row 는 좌우 여백을 없앤다. */
  function externalSafeTip(context) {
    var chart = context.chart;
    var tip = context.tooltip;
    var parent = chart.canvas.parentNode;
    var el = parent.querySelector('.hr-dash__safe-tip');
    if (!el) {
      el = document.createElement('div');
      el.className = 'hr-dash__safe-tip';
      parent.appendChild(el);
    }
    if (!tip || tip.opacity === 0) {
      el.style.opacity = '0';
      return;
    }
    var title = (tip.title || []).join('');
    var rows = (tip.body || []).map(function (b, i) {
      var color = (tip.labelColors[i] && tip.labelColors[i].backgroundColor) || '#ccc';
      return '<span class="line"><i style="background:' + color + '"></i>' + b.lines.join(' ') + '</span>';
    }).join('');
    el.innerHTML = '<strong>' + title + '</strong>' + rows;
    el.style.opacity = '1';
  }

  function renderSafety(list) {
    var $leg = $('#safeLegend').empty();
    [
      { label: '수료', color: GRAY },
      { label: '미수료', color: YELLOW }
    ].forEach(function (leg) {
      $leg.append(
        '<span class="item"><i style="background:' + leg.color + '"></i>' + leg.label + '</span>'
      );
    });
    (list || []).forEach(function (item) {
      var period = $.trim($('#' + item.id).siblings('.hr-dash__safe-center').text());
      createChart(item.id, {
        type: 'doughnut',
        data: {
          labels: ['수료', '미수료'],
          datasets: [{
            data: [item.done, item.miss],
            backgroundColor: [GRAY, YELLOW],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          rotation: -90,
          cutout: '58%',
          layout: { padding: { top: 12, right: 12, bottom: 12, left: 12 } },
          plugins: {
            legend: { display: false },
            datalabels: {
              color: '#475569',
              font: { weight: 'bold', size: 15, family: CHART_FONT },
              formatter: function (v) {
                return v ? pctText(v) : '';
              },
              clip: false,
              clamp: true,
              anchor: 'center',
              align: function (ctx) { return ctx.dataIndex === 1 ? 'top' : 'center'; },
              offset: function (ctx) { return ctx.dataIndex === 1 ? 8 : 0; }
            },
            tooltip: {
              enabled: false,
              mode: 'dataset',
              intersect: true,
              external: externalSafeTip,
              callbacks: {
                title: function () { return period; },
                label: function (ctx) {
                  return (ctx.label || '') + '  ' + pctText(ctx.raw);
                }
              }
            }
          }
        }
      });
    });
  }

  var legendEndPlugin = {
    id: 'd04LegendEnd',
    afterLayout: function (chart, _args, opts) {
      var leg = chart.legend;
      if (!leg || leg.options.display === false) return;
      var pad = (opts && opts.pad) || 8;
      var shift = (chart.width - pad) - leg.right;
      if (!shift) return;
      leg.left += shift;
      leg.right += shift;
      (leg.legendHitBoxes || []).forEach(function (box) {
        box.left += shift;
      });
    }
  };

  function renderCheckup(d) {
    createChart('chart04Checkup', {
      type: 'bar',
      plugins: [countPlugin, legendEndPlugin],
      data: {
        labels: d.labels,
        datasets: [
          {
            label: '수검',
            data: d.done,
            backgroundColor: BLUE,
            borderWidth: 0,
            barPercentage: 0.55,
            categoryPercentage: 0.6
          },
          {
            label: '미수검',
            data: d.miss,
            backgroundColor: BLUE_DARK,
            borderWidth: 0,
            barPercentage: 0.55,
            categoryPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 18, right: 64, bottom: 0, left: 8 } },
        plugins: {
          legend: topLegend(),
          datalabels: { display: false },
          /* 오른쪽 콜아웃 여백은 막대에만 두고, 범례는 다른 카드와 같이 캔버스 오른쪽에 붙인다 */
          d04LegendEnd: { pad: 8 }
        },
        scales: {
          x: $.extend(true, {}, axisFont(), { stacked: true }),
          y: {
            stacked: true,
            min: 0,
            max: 112,
            ticks: { display: false },
            grid: { display: false, drawTicks: false },
            border: { display: false }
          }
        }
      }
    });
  }

  function renderGrievance(d) {
    var years = d.years || [];
    var html = '<table class="hr-dash__griev"><thead><tr>';
    html += '<th rowspan="2">구분</th><th rowspan="2">내용</th>';
    years.forEach(function (y) {
      html += '<th colspan="2">' + y + '</th>';
    });
    html += '</tr><tr>';
    years.forEach(function () {
      html += '<th>접수</th><th>조치</th>';
    });
    html += '</tr></thead><tbody>';
    var sums = [];
    (d.rows || []).forEach(function (row) {
      html += '<tr><th scope="row">' + row.group + '</th><td class="detail">' + row.detail + '</td>';
      (row.cells || []).forEach(function (n, i) {
        sums[i] = (sums[i] || 0) + n;
        html += '<td>' + n + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody><tfoot><tr><td colspan="2">합계</td>';
    sums.forEach(function (n) { html += '<td>' + n + '</td>'; });
    html += '</tr></tfoot></table>';
    $('#grievTable').html(html);
    pinGrievHead();
  }

  function pinGrievHead() {
    var table = document.querySelector('.hr-dash__griev');
    if (!table) return;
    var head = table.querySelector('thead tr:first-child th[colspan]');
    if (!head) return;
    var h = head.getBoundingClientRect().height;
    if (h > 0) table.style.setProperty('--griev-head1', h + 'px');
  }

  function renderAll(data) {
    data = data || SAMPLE;
    renderAccident(data.accident);
    renderSafety(data.safety);
    renderCheckup(data.checkup);
    renderGrievance(data.grievance);
  }

  function resizeAllCharts() {
    $.each(charts, function (id, c) {
      if (!c) return;
      var el = document.getElementById(id);
      if (el) fitCanvas(el);
      try { c.resize(); } catch (e) {}
    });
    pinGrievHead();
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

  window.HrDashboard04 = { render: renderAll, sample: SAMPLE };
})(window, jQuery);
