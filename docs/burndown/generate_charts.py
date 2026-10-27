"""Generate proposed-SP tables and illustrative plan charts, never actual progress.

Run from the repository root:
    python -m pip install -r docs/burndown/requirements.txt
    python docs/burndown/generate_charts.py

story-points.csv is the estimate source. No daily Actual observations are supplied.
The horizontal axis is normalized plan progress, not historical calendar dates.
"""

import csv
from collections import defaultdict
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator


ROOT = Path(__file__).resolve().parent
DOC = ROOT.parent / "scrum.md"
TABLE_START = "<!-- proposed-sp-table:start -->"
TABLE_END = "<!-- proposed-sp-table:end -->"
TOTALS_START = "<!-- proposed-sp-totals:start -->"
TOTALS_END = "<!-- proposed-sp-totals:end -->"


def replace_block(text, start, end, body):
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError(f"Expected exactly one marker pair: {start}, {end}")
    before, rest = text.split(start, 1)
    _, after = rest.split(end, 1)
    return f"{before}{start}\n{body}\n{end}{after}"


def main():
    with (ROOT / "story-points.csv").open(encoding="utf-8-sig", newline="") as source:
        rows = list(csv.DictReader(source))
    if [int(row["task"]) for row in rows] != list(range(1, 11)):
        raise ValueError("Expected tasks 1 through 10, once each and in order")

    totals = defaultdict(int)
    for row in rows:
        sprint = int(row["sprint"])
        points = int(row["proposed_sp"])
        expected_sprint = 1 if int(row["task"]) <= 4 else 2 if int(row["task"]) <= 7 else 3
        if sprint != expected_sprint or points not in (1, 2, 3, 5, 8, 13):
            raise ValueError(f"Invalid sprint or estimate for task {row['task']}")
        if row["estimate_status"] != "proposed":
            raise ValueError("These charts are only for proposed estimates")
        totals[sprint] += points

    table = [
        "| # | Task | Sprint | Điểm chấm bài | SP đề xuất | Trạng thái ghi sẵn |",
        "|---|---|---|---|---|---|",
    ]
    for row in rows:
        table.append(
            f"| {row['task']} | {row['title']} | {row['sprint']} | "
            f"{row['grading_points']} | {row['proposed_sp']} | {row['original_status']} |"
        )
    grade_total = sum(int(row["grading_points"]) for row in rows)
    table.append(f"| **Tổng** | **10 task** | **3 Sprint** | **{grade_total}** | **{sum(totals.values())}** | |")

    document = DOC.read_text(encoding="utf-8")
    document = replace_block(document, TABLE_START, TABLE_END, "\n".join(table))
    summary = "\n".join(
        [f"- **Sprint {sprint}: {totals[sprint]} SP đề xuất.**" for sprint in (1, 2, 3)]
        + [f"- **Toàn bộ backlog: {sum(totals.values())} SP đề xuất**, tách biệt với {grade_total} điểm chấm bài."]
    )
    document = replace_block(document, TOTALS_START, TOTALS_END, summary)
    DOC.write_text(document, encoding="utf-8", newline="\n")

    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 12})
    for sprint in (1, 2, 3):
        total = totals[sprint]
        fig, ax = plt.subplots(figsize=(13, 7.5), dpi=160)
        fig.patch.set_facecolor("#0f172a")
        ax.set_facecolor("#0f172a")
        fig.subplots_adjust(left=0.09, right=0.96, top=0.73, bottom=0.24)
        fig.text(0.08, 0.92, f"BrewLite / Sprint {sprint}", color="#f8fafc", fontsize=23, weight="bold")
        fig.text(0.08, 0.86, f"Đường lý tưởng từ ước lượng đề xuất: {total} SP", color="#cbd5e1", fontsize=15)
        fig.text(0.08, 0.80, "MINH HỌA KẾ HOẠCH - CHƯA ĐƯỢC NHÓM XÁC NHẬN", color="#fdba74", fontsize=11)

        ax.plot([0, 100], [total, 0], color="#fb923c", linewidth=2.8, label="Lý tưởng (kế hoạch đề xuất)")
        ax.scatter([0, 100], [total, 0], color="#fb923c", s=35, zorder=3, clip_on=False)
        ax.set_xlim(0, 100)
        ax.set_ylim(0, total * 1.2)
        ax.set_xticks([0, 25, 50, 75, 100])
        ax.yaxis.set_major_locator(MaxNLocator(nbins=5, integer=True))
        ax.set_xlabel("Tiến trình Sprint theo kế hoạch (%)", color="#cbd5e1", labelpad=12)
        ax.set_ylabel("Story points còn lại (SP)", color="#cbd5e1", labelpad=12)
        ax.tick_params(colors="#cbd5e1")
        ax.grid(color="#334155", alpha=0.65, linewidth=0.7)
        ax.set_axisbelow(True)
        ax.spines[["top", "right"]].set_visible(False)
        ax.spines[["bottom", "left"]].set_color("#64748b")
        legend = ax.legend(loc="upper right", facecolor="#0f172a", edgecolor="#334155", fontsize=11)
        for label in legend.get_texts():
            label.set_color("#e2e8f0")

        fig.text(0.08, 0.14, "Chưa có đường Thực tế (Actual): thiếu số liệu tiến độ đã xác nhận.", color="#f8fafc", fontsize=12)
        fig.text(0.08, 0.09, "Nguồn: story-points.csv / Đề xuất ngày 27/10/2026 / Trục X quy đổi 0-100%.", color="#94a3b8", fontsize=10)
        fig.text(0.08, 0.045, "Chưa gắn ngày Sprint thực tế. Ảnh này không thay thế báo cáo Burndown thực tế.", color="#94a3b8", fontsize=10)
        fig.savefig(ROOT / f"sprint-{sprint}-plan.png", facecolor=fig.get_facecolor())
        plt.close(fig)
        print(f"Sprint {sprint}: {total} proposed SP -> sprint-{sprint}-plan.png")


if __name__ == "__main__":
    main()
