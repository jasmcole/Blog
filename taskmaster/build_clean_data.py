#!/usr/bin/env python3
"""Fetch raw Taskmaster data from TaskMaster.Info, Taskmaster Wiki, and upstream scores,
clean and reconcile all scores for UK Series 1-20, and output the final clean scores CSV.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_CACHE_DIR = SCRIPT_DIR / "source-cache"
DEFAULT_OUTPUT_CSV = SCRIPT_DIR / "taskmaster-clean-scores.csv"

TMI = "https://www.taskmaster.info"
WIKI_API = "https://taskmaster.fandom.com/api.php"
WIKI = "https://taskmaster.fandom.com/wiki/"
UPSTREAM_BASE = "https://raw.githubusercontent.com/silverdavi/taskmaster-uk-scores/2842413d327ec9c0e3638a9c124485718f5ab8e2/data"

SEASON_IDS = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 7, 7: 8, 8: 9, 9: 10,
    10: 11, 11: 32, 12: 38, 13: 48, 14: 55, 15: 56, 16: 73,
    17: 74, 18: 75, 19: 76, 20: 77,
}
HEADERS = {"User-Agent": "taskmaster-blog-analysis/1.0 (research; cached requests)"}
SNAPSHOT_DATE = "2026-09-20"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, str]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def cached_get(url: str, path: Path, params: dict | None = None) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, params=params, headers=HEADERS, timeout=45)
    response.raise_for_status()
    path.write_text(response.text, encoding="utf-8")
    time.sleep(0.08)
    return response.text


def text(node) -> str:
    return re.sub(r"\s+", " ", node.get_text(" ", strip=True)).strip() if node else ""


def series_number(label: str) -> int | None:
    match = re.fullmatch(r"Series (\d+)", label)
    return int(match.group(1)) if match else None


def ensure_upstream_file(cache_dir: Path, filename: str) -> Path:
    target = cache_dir / filename
    if not target.exists():
        url = f"{UPSTREAM_BASE}/{filename}"
        cached_get(url, target)
    return target


def raw_episodes(cache_dir: Path) -> list[dict]:
    episodes_file = ensure_upstream_file(cache_dir, "episodes.csv")
    rows = []
    for row in read_csv(episodes_file):
        series = series_number(row["series"])
        if series is None or not 1 <= series <= 20:
            continue
        rows.append({
            "series": series,
            "episode": int(row["episode_num"]),
            "episode_title_raw": row["episode_title"],
            "air_date": row["air_date"],
            "contestants": [x.strip() for x in row["contestants"].split(";")],
            "official_totals": [int(float(row[f"total_{i}"])) for i in range(1, 6)],
        })
    return rows


def fetch_season(cache_dir: Path, series: int) -> tuple[int, list[dict]]:
    season_id = SEASON_IDS[series]
    url = f"{TMI}/season.php?id={season_id}"
    cache_path = cache_dir / "taskmaster-info" / "seasons" / f"series-{series:02d}.html"
    body = cached_get(url, cache_path)
    soup = BeautifulSoup(body, "html.parser")
    episodes = []
    for position, anchor in enumerate(soup.select("#episodes .episodeTitle a"), start=1):
        match = re.search(r"id=(\d+)", anchor.get("href", ""))
        if match:
            episodes.append({
                "episode": position,
                "tmi_episode_id": int(match.group(1)),
                "tmi_title": text(anchor),
                "tmi_episode_url": urljoin(TMI, anchor["href"]),
            })
    return series, episodes


def fetch_tmi_episode(cache_dir: Path, series: int, episode: int, episode_id: int) -> dict:
    url = f"{TMI}/episode.php?id={episode_id}"
    cache_path = cache_dir / "taskmaster-info" / "episodes" / f"s{series:02d}e{episode:02d}-{episode_id}.html"
    body = cached_get(url, cache_path)
    soup = BeautifulSoup(body, "html.parser")
    tasks = []
    for position, card in enumerate(soup.select("#tasks > .task"), start=1):
        anchor = card.select_one("h3.taskLink a")
        if not anchor:
            continue
        match = re.search(r"id=(\d+)", anchor.get("href", ""))
        icons = []
        for icon in card.select(".taskTypeIcon"):
            icons.append(Path(icon.get("src", "")).stem.removesuffix("_bw"))
        tasks.append({
            "position": position,
            "tmi_task_id": int(match.group(1)) if match else "",
            "tmi_task_title": text(anchor),
            "tmi_task_url": urljoin(TMI, anchor.get("href", "")),
            "tmi_types": icons,
        })
    return {"tasks": tasks, "url": url}


def fetch_wiki_page(cache_dir: Path, series: int, episode: int, title: str) -> dict:
    path = cache_dir / "taskmaster-wiki" / "episodes" / f"s{series:02d}e{episode:02d}.json"
    if path.exists():
        cached = json.loads(path.read_text(encoding="utf-8"))
        cached_html = cached.get("parse", {}).get("text", {}).get("*", "")
        if 'class="tmtable"' in cached_html:
            return cached
    result = None
    for candidate in dict.fromkeys([title, title.rstrip("."), title + "."]):
        response = requests.get(
            WIKI_API,
            params={"action": "parse", "page": candidate, "prop": "text", "format": "json"},
            headers=HEADERS, timeout=45,
        )
        response.raise_for_status()
        payload = response.json()
        if "parse" in payload and 'class="tmtable"' in payload["parse"]["text"]["*"]:
            result = payload
            break
    if result is None:
        response = requests.get(
            WIKI_API,
            params={"action": "query", "list": "search", "srsearch": title, "srlimit": 5, "format": "json"},
            headers=HEADERS, timeout=45,
        )
        response.raise_for_status()
        hits = response.json().get("query", {}).get("search", [])
        if not hits:
            raise RuntimeError(f"No Wiki page found for S{series}E{episode}: {title}")
        for hit in hits:
            response = requests.get(
                WIKI_API,
                params={"action": "parse", "page": hit["title"], "prop": "text", "format": "json"},
                headers=HEADERS, timeout=45,
            )
            response.raise_for_status()
            candidate = response.json()
            candidate_html = candidate.get("parse", {}).get("text", {}).get("*", "")
            if 'class="tmtable"' in candidate_html:
                result = candidate
                break
        if result is None:
            raise RuntimeError(f"No Wiki episode score table found for S{series}E{episode}: {title}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    time.sleep(0.08)
    return result


def expand_table(table) -> list[list]:
    rows, pending = [], {}
    for tr in table.find_all("tr", recursive=False):
        row, col = [], 0
        source = iter(tr.find_all(["th", "td"], recursive=False))
        while True:
            if col in pending:
                remaining, cell = pending[col]
                row.append(cell)
                if remaining <= 1:
                    del pending[col]
                else:
                    pending[col] = (remaining - 1, cell)
                col += 1
                continue
            try:
                cell = next(source)
            except StopIteration:
                break
            colspan, rowspan = int(cell.get("colspan", 1)), int(cell.get("rowspan", 1))
            for _ in range(colspan):
                row.append(cell)
                if rowspan > 1:
                    pending[col] = (rowspan - 1, cell)
                col += 1
        while col in pending:
            remaining, cell = pending[col]
            row.append(cell)
            if remaining <= 1:
                del pending[col]
            else:
                pending[col] = (remaining - 1, cell)
            col += 1
        rows.append(row)
    return rows


def score_value(raw: str) -> tuple[float | None, str]:
    value = raw.strip().replace("−", "-").replace("–", "-")
    compact = re.sub(r"\s+", "", value).upper()
    if not compact or compact in {"-", "—", "N/A", "NA"}:
        return None, "not_participating"
    if "DQ" in compact or "DISQUAL" in compact:
        return 0.0, "disqualified"
    match = re.match(r"^([+-]?\d+(?:\.\d+)?(?:[+]\d+(?:\.\d+)?)*)", compact)
    if not match:
        return None, f"unparsed:{value}"
    return sum(float(x) for x in match.group(1).split("+")), "awarded"


def task_number(raw: str) -> str:
    match = re.search(r"\d+(?:[a-z])?", raw.lower())
    return match.group(0) if match else ""


def parse_wiki_episode(payload: dict) -> dict:
    parsed = payload["parse"]
    title = parsed["title"]
    soup = BeautifulSoup(parsed["text"]["*"], "html.parser")
    tables = soup.select("table.tmtable")
    if not tables:
        raise RuntimeError(f"No episode score table on Wiki page {title}")
    table = max(tables, key=lambda item: len(item.select("tr.tmtablerow")))
    matrix = expand_table(table.find("tbody", recursive=False) or table)
    header = [text(cell) for cell in matrix[0]]
    if len(header) < 7 or header[0].lower() != "task":
        raise RuntimeError(f"Unexpected Wiki table header on {title}: {header}")
    contestants = header[2:]
    tasks, current, totals = [], None, None
    for cells in matrix[1:]:
        values = [text(cell) for cell in cells]
        if not values:
            continue
        classes = set(cells[0].get("class", []))
        if "tmtabletotal" in classes or values[0].lower() == "total":
            totals = [score_value(x)[0] for x in values[-len(contestants):]]
            continue
        if len(cells) < 2 + len(contestants):
            continue
        number = task_number(values[0])
        anchor = cells[0].find("a")
        same = current is not None and cells[0] is current["task_cell"]
        if values[0].strip().upper() == "S":
            current = None
            continue
        if number and not same:
            href = anchor.get("href", "") if anchor else ""
            current = {
                "task_cell": cells[0],
                "wiki_task_num": number,
                "wiki_task_title": anchor.get("title", "") if anchor else "",
                "wiki_task_url": urljoin(WIKI, href),
                "descriptions": [],
                "score_parts": [[] for _ in contestants],
                "statuses": [[] for _ in contestants],
                "score_cells": [set() for _ in contestants],
            }
            tasks.append(current)
        if current is None:
            continue
        current["descriptions"].append(values[-(len(contestants) + 1)])
        for i, raw in enumerate(values[-len(contestants):]):
            cell_identity = id(cells[-len(contestants) + i])
            if cell_identity in current["score_cells"][i]:
                continue
            current["score_cells"][i].add(cell_identity)
            val, st = score_value(raw)
            current["score_parts"][i].append(val)
            current["statuses"][i].append(st)
    for task in tasks:
        scores, statuses = [], []
        for parts, part_statuses in zip(task.pop("score_parts"), task.pop("statuses")):
            nums = [x for x in parts if x is not None]
            scores.append(sum(nums) if nums else None)
            if "awarded" in part_statuses:
                statuses.append("disqualified" if not sum(nums) and "disqualified" in part_statuses else "awarded")
            elif "disqualified" in part_statuses:
                statuses.append("disqualified")
            elif any(x.startswith("unparsed:") for x in part_statuses):
                statuses.append(";".join(part_statuses))
            else:
                statuses.append("not_participating")
        task["description"] = " | ".join(filter(None, task.pop("descriptions")))
        task["scores"], task["score_statuses"] = scores, statuses
        task.pop("score_cells")
        task.pop("task_cell")
    bases_with_b = {x["wiki_task_num"][:-1] for x in tasks if x["wiki_task_num"].endswith("b")}
    tasks = [
        x for x in tasks
        if not (
            x["wiki_task_num"].endswith("a")
            and x["wiki_task_num"][:-1] in bases_with_b
            and all(value == 0 for value in x["scores"])
        )
    ]
    return {
        "title": title,
        "url": WIKI + quote(title.replace(" ", "_"), safe="_().,'-"),
        "contestants": contestants,
        "tasks": tasks,
        "totals": totals,
    }


def normalise_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", html.unescape(name).lower())


def fmt(value: float | None) -> str:
    if value is None:
        return ""
    return str(int(value)) if float(value).is_integer() else str(value)


def match_tmi_task(wiki_task: dict, tmi_tasks: list[dict]) -> tuple[dict | None, float]:
    query = (wiki_task["wiki_task_title"] + " " + wiki_task["description"]).lower()
    query_words = set(re.findall(r"[a-z0-9]+", query))
    best, best_score = None, -1.0
    for candidate in tmi_tasks:
        title = candidate["tmi_task_title"].lower()
        words = set(re.findall(r"[a-z0-9]+", title))
        overlap = len(query_words & words) / max(1, len(words))
        sequence = SequenceMatcher(None, wiki_task["wiki_task_title"].lower(), title).ratio()
        score = 0.65 * overlap + 0.35 * sequence
        if score > best_score:
            best, best_score = candidate, score
    return best, best_score


def build_dataset(cache_dir: Path, output_file: Path, workers: int = 6) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    episodes = raw_episodes(cache_dir)

    season_results = {}
    with ThreadPoolExecutor(max_workers=min(workers, 6)) as pool:
        futures = [pool.submit(fetch_season, cache_dir, series) for series in range(1, 21)]
        for future in as_completed(futures):
            series, result = future.result()
            season_results[series] = result

    refs = []
    for series in range(1, 21):
        tmi_eps = season_results.get(series, [])
        raw_eps = sorted((e for e in episodes if e["series"] == series), key=lambda e: e["episode"])
        for raw, tmi in zip(raw_eps, tmi_eps):
            refs.append({**raw, **tmi})

    tmi_data, wiki_data = {}, {}
    with ThreadPoolExecutor(max_workers=workers) as pool:
        jobs = {}
        for ref in refs:
            key = (ref["series"], ref["episode"])
            jobs[pool.submit(fetch_tmi_episode, cache_dir, *key, ref["tmi_episode_id"])] = ("tmi", key)
            jobs[pool.submit(fetch_wiki_page, cache_dir, *key, ref["episode_title_raw"])] = ("wiki", key)
        for future in as_completed(jobs):
            kind, key = jobs[future]
            result = future.result()
            if kind == "wiki":
                wiki_data[key] = parse_wiki_episode(result)
            else:
                tmi_data[key] = result

    score_rows = []
    task_count = 0
    for ref in refs:
        key = (ref["series"], ref["episode"])
        if key not in tmi_data or key not in wiki_data:
            continue
        tmi, wiki = tmi_data[key], wiki_data[key]
        contestants = ref["contestants"]
        scoring_tmi = [
            task for task in tmi["tasks"]
            if "tiebreak" not in task["tmi_types"] and "unjudged" not in task["tmi_types"]
        ]
        for position, wiki_task in enumerate(wiki["tasks"], start=1):
            if len(scoring_tmi) == len(wiki["tasks"]):
                tmi_task, match_score = scoring_tmi[position - 1], 1.0
            else:
                tmi_task, match_score = match_tmi_task(wiki_task, scoring_tmi)
            if tmi_task is None:
                continue
            task_count += 1
            stable_id = f"uk-s{key[0]:02d}-e{key[1]:02d}-t{position:02d}"
            types = set(tmi_task["tmi_types"])
            is_tiebreak = int("tiebreak" in types or "tie-break" in wiki_task["description"].lower())
            is_prize = int("prize" in types)
            is_live = int("live" in types or "live:" in wiki_task["description"].lower())
            is_filmed = int("filmed" in types)
            is_special = int("special" in types)
            is_movable = int(is_filmed and not (is_prize or is_live or is_tiebreak or is_special))

            for seat, contestant in enumerate(contestants):
                value = wiki_task["scores"][seat] if seat < len(wiki_task["scores"]) else None
                status = wiki_task["score_statuses"][seat] if seat < len(wiki_task["score_statuses"]) else "missing"
                if value is None and status == "not_participating" and not is_tiebreak:
                    value = 0.0
                score_rows.append({
                    "task_id": stable_id,
                    "series": key[0],
                    "episode": key[1],
                    "episode_title": wiki["title"],
                    "task_order": position,
                    "contestant": contestant,
                    "seat": seat + 1,
                    "score": fmt(value),
                    "score_status": status,
                    "is_tiebreak": is_tiebreak,
                    "is_movable_prerecorded": is_movable,
                    "taskmaster_info_url": tmi_task["tmi_task_url"],
                    "taskmaster_wiki_url": wiki_task["wiki_task_url"],
                    "source_accessed": SNAPSHOT_DATE,
                })

    score_fields = [
        "task_id", "series", "episode", "episode_title", "task_order", "contestant", "seat",
        "score", "score_status", "is_tiebreak", "is_movable_prerecorded",
        "taskmaster_info_url", "taskmaster_wiki_url", "source_accessed",
    ]
    write_csv(output_file, score_rows, score_fields)
    print(f"Written {len(score_rows)} scores across {task_count} tasks in {len(refs)} episodes to {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Build cleaned Taskmaster scores dataset.")
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR, help="Directory for cached HTML and JSON source files")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_CSV, help="Output CSV filepath")
    parser.add_argument("--workers", type=int, default=6, help="Concurrent workers for network fetching")
    args = parser.parse_args()

    build_dataset(args.cache_dir, args.output, args.workers)


if __name__ == "__main__":
    main()
