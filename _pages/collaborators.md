---
layout: page
title: Friends and Collaborators
permalink: /collaborators/
nav: true
nav_order: 7
description: Friends and collaborators map
map: true
---

<div id="collaborators-map" class="map"></div>

{% include collaborators_map.liquid %}

<p class="mt-3 text-muted">
  Hover a marker to see collaborator details.
</p>

<hr>

<h2>Top collaborators (by coauthored papers)</h2>
<p class="text-muted">Computed from the site BibTeX (one-time snapshot). Names may include multiple variants.</p>

<div class="row">
  <div class="col-md-8">
    <ol>
      {% for c in site.data.collaborator_counts limit: 20 %}
        <li>{{ c.name }} <span class="text-muted">({{ c.count }})</span></li>
      {% endfor %}
    </ol>
  </div>
</div>
