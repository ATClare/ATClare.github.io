---
layout: page
permalink: /publications/
title: Publications
description: Publications (reverse chronological order).
nav: true
nav_order: 2
---

{% include bib_search.liquid %}

<p class="text-muted">
  Tip: each paper entry supports optional links (DOI, PDF, code) and a small thumbnail (graphical abstract) via the <code>preview</code> field.
</p>

<div class="publications">
  {% bibliography %}
</div>
