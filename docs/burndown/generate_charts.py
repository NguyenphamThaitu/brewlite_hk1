"""Vẽ biểu đồ Burndown BrewLite từ story-points.csv và cập nhật bảng trong scrum.md.

Chạy từ thư mục gốc repo:
    python -m pip install -r docs/burndown/requirements.txt
    python docs/burndown/generate_charts.py

Quy ước:
- Một task chỉ được trừ SP vào cuối ngày nó hoàn thành (done_date), trừ trọn SP.
- Thực tế (Actual) = tổng SP của các task chưa hoàn thành tính đến cuối mỗi ngày.
- Lý tưởng (Ideal) = S * (1 - d / D), S = tổng SP, D = số ngày từ bắt đầu đến kết thúc.
"""

import csv
from datetime import date, timedelta
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
DOC = ROOT.parent / "scrum.md"

START = date(2026, 10, 20)  # ngày bắt đầu làm (commit đầu tiên)
END = date(2026, 10, 28)  # Sprint Review, mốc kết thúc
FIBONACCI = (1, 2, 3, 5, 8, 13)
SPRINT_OF_TASK = {t: 1 if t <= 4 else 2 if t <= 7 else 3 for t in range(1, 11)}
SPRINT_COLORS = {1: "#38bdf8", 2: "#a78bfa", 3: "#f472b6"}


def replace_block(text, name, body):
    start, end = f"<!-- {name}:start -->", f"<!-- {name}:end -->"
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError(f"Cần đúng một cặp đánh dấu {name}")
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    return f"{before}{start}\n{body}\n{end}{after}"


def load_tasks():
    with (ROOT / "story-points.csv").open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    tasks = []
    for row in rows:
        t = {
            "task": int(row["task"]),
            "sprint": int(row["sprint"]),
            "grade": int(row["grading_points"]),
            "sp": int(row["story_points"]),
            "title": row["title"],
            "status": row["status"],
            "done": date.fromisoformat(row["done_date"]),
            "evidence": row["evidence"],
        }
        if t["sprint"] != SPRINT_OF_TASK.get(t["task"]) or t["sp"] not in FIBONACCI:
            raise ValueError(f"Sai Sprint hoặc SP ở task {t['task']}")
        if not START <= t["done"] <= END:
            raise ValueError(f"Ngày hoàn thành task {t['task']} nằm ngoài {START}..{END}")
        tasks.append(t)
    if [t["task"] for t in tasks] != list(range(1, 11)):
        raise ValueError("Cần đủ task 1 đến 10, đúng thứ tự")
    return tasks


def fmt(d):
    return d.strftime("%d/%m")


def main():
    tasks = load_tasks()
    total = sum(t["sp"] for t in tasks)
    sprint_sp = {s: sum(t["sp"] for t in tasks if t["sprint"] == s) for s in (1, 2, 3)}
    days = [START + timedelta(i) for i in range((END - START).days + 1)]
    n = len(days)  # D: số ngày; điểm 0 là lúc bắt đầu, điểm i là cuối ngày thứ i

    # SP còn lại theo Sprint ở cuối mỗi ngày
    remaining = {
        s: [sum(t["sp"] for t in tasks if t["sprint"] == s and t["done"] > d) for d in days]
        for s in (1, 2, 3)
    }
    actual = [total] + [sum(remaining[s][i] for s in (1, 2, 3)) for i in range(n)]
    ideal = [round(total * (1 - i / n), 1) for i in range(n + 1)]

    # --- Cập nhật scrum.md ---
    table = [
        "| # | Task | Sprint | Điểm chấm bài | Story points | Trạng thái | Ngày hoàn thành | Commit minh chứng |",
        "|---|---|---|---|---|---|---|---|",
    ]
    table += [
        f"| {t['task']} | {t['title']} | {t['sprint']} | {t['grade']} | {t['sp']} | "
        f"{t['status']} | {fmt(t['done'])}/{t['done'].year} | `{t['evidence']}` |"
        for t in tasks
    ]
    grade_total = sum(t["grade"] for t in tasks)
    table.append(f"| **Tổng** | **10 task** | **3 Sprint** | **{grade_total}** | **{total}** | **10/10 hoàn thành** | | |")

    totals = "\n".join(
        [f"- **Sprint {s}: {sprint_sp[s]} SP** — hoàn thành ngày "
         f"{fmt(max(t['done'] for t in tasks if t['sprint'] == s))}/2026." for s in (1, 2, 3)]
        + [f"- **Toàn bộ backlog: {total} SP** (tách biệt với {grade_total} điểm chấm bài)."]
    )

    daily = [
        "| Thời điểm | Task hoàn thành trong ngày | SP trừ | Còn lại S1 | Còn lại S2 | Còn lại S3 | Lý tưởng | **Thực tế** |",
        "|---|---|---|---|---|---|---|---|",
        f"| Bắt đầu {fmt(START)} | — | 0 | {sprint_sp[1]} | {sprint_sp[2]} | {sprint_sp[3]} | {ideal[0]:g} | **{total}** |",
    ]
    for i, d in enumerate(days):
        done = [t for t in tasks if t["done"] == d]
        names = ", ".join(f"Task {t['task']}" for t in done) or "—"
        daily.append(
            f"| Cuối {fmt(d)} | {names} | {sum(t['sp'] for t in done)} | {remaining[1][i]} | "
            f"{remaining[2][i]} | {remaining[3][i]} | {ideal[i + 1]:g} | **{actual[i + 1]}** |"
        )

    doc = DOC.read_text(encoding="utf-8")
    doc = replace_block(doc, "sp-table", "\n".join(table))
    doc = replace_block(doc, "sp-totals", totals)
    doc = replace_block(doc, "burndown-daily", "\n".join(daily))
    DOC.write_text(doc, encoding="utf-8", newline="\n")

    # --- Vẽ biểu đồ ---
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 12})
    fig, ax = plt.subplots(figsize=(13, 7.5), dpi=160)
    bg = "#0f172a"
    fig.patch.set_facecolor(bg)
    ax.set_facecolor(bg)
    fig.subplots_adjust(left=0.08, right=0.97, top=0.80, bottom=0.19)
    fig.text(0.08, 0.92, "BrewLite — Burndown Chart (3 Sprint, 10 task)", color="#f8fafc", fontsize=22, weight="bold")
    fig.text(0.08, 0.86, f"Tổng {total} SP · {fmt(START)} → {fmt(END)}/2026 · Hoàn thành 10/10 task ngày "
             f"{fmt(max(t['done'] for t in tasks))}", color="#cbd5e1", fontsize=14)

    x = list(range(n + 1))
    labels = [f"Bắt đầu\n{fmt(START)}"] + [fmt(d) for d in days]

    # Cột chồng: SP còn lại của từng Sprint ở cuối mỗi ngày
    bottom = [0] * (n + 1)
    for s in (1, 2, 3):
        heights = [sprint_sp[s]] + remaining[s]  # điểm 0 = lúc bắt đầu, chưa task nào xong
        ax.bar(x, heights, bottom=bottom, width=0.55, color=SPRINT_COLORS[s], alpha=0.35,
               label=f"Còn lại Sprint {s} ({sprint_sp[s]} SP)")
        bottom = [b + h for b, h in zip(bottom, heights)]

    ax.plot(x, ideal, color="#94a3b8", linestyle="--", linewidth=2.2, label="Lý tưởng (Ideal)")
    ax.plot(x, actual, color="#fb923c", linewidth=3, marker="o", markersize=7, label="Thực tế (Actual)", zorder=4)
    for xi, v in zip(x, actual):
        ax.annotate(str(v), (xi, v), textcoords="offset points", xytext=(0, 10), ha="center",
                    color="#fdba74", fontsize=11, weight="bold")

    ax.set_xticks(x, labels)
    ax.set_xlim(-0.4, n + 0.4)
    ax.set_ylim(0, total * 1.15)
    ax.set_xlabel("Ngày (cuối ngày)", color="#cbd5e1", labelpad=10)
    ax.set_ylabel("Story points còn lại (SP)", color="#cbd5e1", labelpad=10)
    ax.tick_params(colors="#cbd5e1")
    ax.grid(axis="y", color="#334155", alpha=0.65, linewidth=0.7)
    ax.set_axisbelow(True)
    ax.spines[["top", "right"]].set_visible(False)
    ax.spines[["bottom", "left"]].set_color("#64748b")
    legend = ax.legend(loc="upper right", facecolor=bg, edgecolor="#334155", fontsize=11)
    for label in legend.get_texts():
        label.set_color("#e2e8f0")

    fig.text(0.08, 0.025, "Nguồn: docs/burndown/story-points.csv — ngày hoàn thành lấy theo commit trên nhánh main. "
             "Task chỉ được trừ SP khi hoàn thành trọn vẹn.", color="#94a3b8", fontsize=10)
    out = ROOT / "burndown.png"
    fig.savefig(out, facecolor=bg)
    plt.close(fig)
    print(f"Total {total} SP, sprint {sprint_sp} -> {out.name}")
    print("Actual:", actual)
    print("Ideal :", ideal)


if __name__ == "__main__":
    main()
