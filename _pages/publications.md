---
layout: page
permalink: /publications/
title: Publications
description: Publications (reverse chronological order).
nav: true
nav_order: 2
---

<div class="pub-controls">
  {% include bib_search.liquid %}

  <div class="pub-filters">
    <label for="pubYear" class="pub-filter-label">Year</label>
    <select id="pubYear" class="pub-filter">
      <option value="all">All</option>
    </select>

    <button id="pubClear" class="pub-filter-btn" type="button">Clear</button>

  </div>
</div>

<h2>Selected</h2>
<div class="publications publications-selected">
  {% bibliography --group_by none --query @*[selected=true]* %}
</div>

<h2>All publications</h2>
<div class="publications publications-all">
  {% bibliography %}
</div>

<script>
  (function () {
    function qs(sel, root) {
      return (root || document).querySelector(sel);
    }
    function qsa(sel, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    const yearSelect = qs('#pubYear');
    const clearBtn = qs('#pubClear');
    const list = qs('.publications-all');
    if (!yearSelect || !list) return;

    const entries = qsa('[data-year]', list);
    const years = Array.from(
      new Set(
        entries
          .map((el) => (el.getAttribute('data-year') || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => Number(b) - Number(a));

    years.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    });

    function apply() {
      const y = yearSelect.value;
      entries.forEach((el) => {
        const match = y === 'all' || (el.getAttribute('data-year') || '').trim() === y;
        el.closest('.row') ? (el.closest('.row').style.display = match ? '' : 'none') : (el.style.display = match ? '' : 'none');
      });
    }

    yearSelect.addEventListener('change', apply);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        yearSelect.value = 'all';
        apply();
      });
    }

    apply();
  })();
</script>
