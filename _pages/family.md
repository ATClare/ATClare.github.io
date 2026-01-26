---
layout: page
title: Family
permalink: /family/
nav: true
nav_order: 4
description: Family
---

<!-- Add photos to assets/img/family/ and update the filenames below. -->

<div class="row">
  <div class="col-md-6 mt-3">
    {% include video.liquid path="assets/img/family/zohreh.mp4" class="img-fluid rounded z-depth-1" controls=true %}
    <div class="caption">Zohreh</div>
  </div>

  <div class="col-md-6 mt-3">
    {% include figure.liquid loading="eager" path="assets/img/family/aaren.jpg" class="img-fluid rounded z-depth-1" alt="Aaren" %}
    <div class="caption">Aaren</div>
  </div>
</div>

<hr>

<h2>More photos</h2>
<div class="row">
  <div class="col-md-6 mt-3">
    {% include figure.liquid loading="lazy" path="assets/img/family/family_1.jpg" class="img-fluid rounded z-depth-1" alt="Family photo 1" %}
  </div>
  <div class="col-md-6 mt-3">
    {% include figure.liquid loading="lazy" path="assets/img/family/family_2.jpg" class="img-fluid rounded z-depth-1" alt="Family photo 2" %}
  </div>
  <div class="col-md-6 mt-3">
    {% include figure.liquid loading="lazy" path="assets/img/family/family_3.jpg" class="img-fluid rounded z-depth-1" alt="Family photo 3" %}
  </div>
  <div class="col-md-6 mt-3">
    {% include figure.liquid loading="lazy" path="assets/img/family/family_4.jpg" class="img-fluid rounded z-depth-1" alt="Family photo 4" %}
  </div>
</div>
