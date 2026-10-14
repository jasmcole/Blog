# Taskmaster Clean Scores

Builds a clean, reconciled dataset of all scores across UK Series 1–20 of Taskmaster (182 episodes, 940 tasks, 4,700 scores).

## Usage

```bash
python build_clean_data.py
```

This reads from the cached HTML and JSON source files in `source-cache/` (or fetches any missing data) and outputs `taskmaster-clean-scores.csv`.
