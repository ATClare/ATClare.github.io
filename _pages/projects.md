---
layout: page
title: Projects
permalink: /projects/
description: Research themes, current directions, and application-facing manufacturing work.
eyebrow: Research
intro: The group works across process development, materials response, metrology, and manufacturing translation. This page highlights the main themes that shape the lab’s current work and the kinds of engineering problems we are interested in solving.
img: assets/img/projects/stochastic-lattices/workflow-stochastic-isosurface.jpg
nav: true
nav_order: 3
---

<div class="content-band">
  <p>
    The common thread through these projects is process capability: understanding how a manufacturing method behaves, how it
    can be controlled, and how it can be trusted when the performance of the final component matters.
  </p>
</div>

<div class="content-grid two-up">
  <section class="content-card">
    <h2>Additive Manufacturing</h2>
    <p>
      Work in additive manufacturing focuses on process understanding, surface integrity, qualification, and post-processing
      routes for components that need repeatable performance in demanding environments.
    </p>
    <ul class="feature-list">
      <li>part quality and feature fidelity</li>
      <li>surface and subsurface condition</li>
      <li>post-processing and finishing strategies</li>
      <li>qualification-oriented process development</li>
    </ul>
  </section>

  <section class="content-card">
    <h2>Electrochemical Jet Processing</h2>
    <p>
      Electrochemical jet processing is a major area of activity in the lab, with work spanning machine architecture,
      process mapping, geometry control, and functional surface generation.
    </p>
    <ul class="feature-list">
      <li>programmable micro-machining</li>
      <li>surface texturing and edge shaping</li>
      <li>repeatability and process windows</li>
      <li>translation to industrial tooling</li>
    </ul>
  </section>

  <section class="content-card">
    <h2>Structured and Stochastic Materials</h2>
    <p>
      The lab also develops architected and stochastic material systems where geometry can be used deliberately to influence
      lightweighting, stiffness, and broader mechanical response.
    </p>
    <ul class="feature-list">
      <li>stochastic lattice generation</li>
      <li>analysis-informed geometry design</li>
      <li>manufacturability of complex structures</li>
      <li>property tailoring through morphology</li>
    </ul>
  </section>

  <section class="content-card">
    <h2>Measurement and Manufacturing Insight</h2>
    <p>
      Many projects combine processing with quantitative inspection, mapping, and analysis so that engineering decisions are
      grounded in what the process is actually doing rather than what it is assumed to be doing.
    </p>
    <ul class="feature-list">
      <li>metrology-led process evaluation</li>
      <li>data-rich experimental workflows</li>
      <li>surface and geometry characterisation</li>
      <li>evidence for qualification and deployment</li>
    </ul>
  </section>
</div>

<div class="content-band">
  <h2>Current Featured Directions</h2>
  <p>
    Two especially visible strands of work at the moment are stochastic lattice design and electrochemical jet processing.
    Both are good examples of the way the lab operates: mechanism-informed research, strong experimental grounding, and a
    clear route toward practical manufacturing use.
  </p>
</div>

<div class="projects">
  <div class="row row-cols-1 row-cols-md-2">
    {% assign featured_projects = site.projects | where_exp: "item", "item.title == 'Stochastic lattices' or item.title == 'Electrolyte Jet Processing'" | sort: "importance" %}
    {% for project in featured_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
</div>
