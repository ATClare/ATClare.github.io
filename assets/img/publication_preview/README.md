# Publication preview thumbnails (graphical abstracts)

If a BibTeX entry in `_bibliography/papers.bib` contains a `preview` field, the publications list will show a thumbnail.

Example:

```bibtex
@article{my_paper_2025,
  title   = {…},
  author  = {…},
  year    = {2025},
  doi     = {10.xxxx/xxxxx},
  preview = {my_paper_2025.svg}
}
```

Put the referenced image file in this folder:

`assets/img/publication_preview/<preview>`

Recommended:
- 1:1-ish aspect ratio (square) works best in the left column.
- Use lightweight SVGs or small PNG/JPGs.
