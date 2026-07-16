from __future__ import annotations

from pathlib import Path

from PIL import Image
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


REPO = Path(__file__).resolve().parents[2]
OUTPUT = REPO / "docs" / "teach" / "deliverables" / "Scholarium_Teach_Corporate_Dossier.pdf"
PAGE_W, PAGE_H = landscape(letter)

NAVY = colors.HexColor("#0B2F4F")
INK = colors.HexColor("#17202A")
BLUE = colors.HexColor("#2F718B")
CYAN = colors.HexColor("#DDF3F8")
MINT = colors.HexColor("#DDF2E8")
CORAL = colors.HexColor("#E97862")
GOLD = colors.HexColor("#E7B85C")
PAPER = colors.HexColor("#F7F8FC")
MUTED = colors.HexColor("#5F6B76")
LINE = colors.HexColor("#D6DEE6")
WHITE = colors.white


def img(path: str) -> Path:
    return REPO / path


def draw_contain(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    with Image.open(path) as image:
        iw, ih = image.size
    scale = min(w / iw, h / ih)
    rw, rh = iw * scale, ih * scale
    c.drawImage(str(path), x + (w - rw) / 2, y + (h - rh) / 2, rw, rh, preserveAspectRatio=True, mask="auto")


def draw_cover_image(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    with Image.open(path) as image:
        iw, ih = image.size
    scale = max(w / iw, h / ih)
    rw, rh = iw * scale, ih * scale
    c.saveState()
    clipping = c.beginPath()
    clipping.rect(x, y, w, h)
    c.clipPath(clipping, stroke=0, fill=0)
    c.drawImage(str(path), x + (w - rw) / 2, y + (h - rh) / 2, rw, rh, preserveAspectRatio=True, mask="auto")
    c.restoreState()


def wrap_lines(text: str, font: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            if stringWidth(candidate, font, size) <= width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def draw_text(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: float = 10, color=INK,
              font: str = "Helvetica", leading: float | None = None, max_lines: int | None = None) -> float:
    leading = leading or size * 1.35
    lines = wrap_lines(text, font, size, width)
    if max_lines is not None:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    cursor = y
    for line in lines:
        c.drawString(x, cursor, line)
        cursor -= leading
    return cursor


def page_header(c: canvas.Canvas, title: str, number: int, label: str = "SCHOLARIUM + TEACH") -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(0.45 * inch, PAGE_H - 0.34 * inch, label)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawRightString(PAGE_W - 0.45 * inch, PAGE_H - 0.34 * inch, f"PRE-ALPHA  |  {number:02d}")
    c.setStrokeColor(LINE)
    c.line(0.45 * inch, PAGE_H - 0.44 * inch, PAGE_W - 0.45 * inch, PAGE_H - 0.44 * inch)
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(NAVY)
    c.drawString(0.45 * inch, PAGE_H - 0.82 * inch, title)


def footer(c: canvas.Canvas) -> None:
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 6.5)
    c.drawString(0.45 * inch, 0.24 * inch, "Evidence cut: 15 July 2026 | Synthetic data only before EFVP | Human authority preserved")


def card(c: canvas.Canvas, x: float, y: float, w: float, h: float, title: str, body: str, fill=WHITE, accent=BLUE) -> None:
    c.setFillColor(fill)
    c.setStrokeColor(LINE)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
    c.setFillColor(accent)
    c.rect(x, y + h - 4, w, 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(x + 12, y + h - 22, title)
    draw_text(c, body, x + 12, y + h - 40, w - 24, 8.2, MUTED, leading=11)


def section_label(c: canvas.Canvas, text: str, x: float, y: float) -> None:
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x, y, text.upper())


def build() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("Scholarium + Teach Corporate Dossier")
    c.setAuthor("SecuredMe Education")

    # 1. Cover
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    draw_cover_image(c, img("apps/web/output/playwright/g12-landing-desktop-final.png"), PAGE_W * 0.53, 0, PAGE_W * 0.47, PAGE_H)
    c.saveState()
    c.setFillColor(NAVY)
    c.setFillAlpha(0.88)
    c.rect(PAGE_W * 0.48, 0, PAGE_W * 0.52, PAGE_H, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.55 * inch, PAGE_H - 0.62 * inch, "SECUREDME EDUCATION  /  EVIDENCE COMMONS")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(0.55 * inch, PAGE_H - 1.55 * inch, "Scholarium + Teach")
    c.setFont("Helvetica", 20)
    c.drawString(0.55 * inch, PAGE_H - 1.98 * inch, "Corporate product and evidence dossier")
    draw_text(c, "A grade is one signal. Learning evidence, strengths, projects, context, and human choice remain connected.",
              0.55 * inch, PAGE_H - 2.62 * inch, 4.55 * inch, 12, CYAN, leading=17)
    c.setFillColor(CORAL)
    c.rect(0.55 * inch, 0.75 * inch, 1.08 * inch, 0.08 * inch, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.55 * inch, 0.52 * inch, "PRE-ALPHA  |  JULY 2026")
    c.showPage()

    # 2. Executive frame
    page_header(c, "Executive frame", 2)
    section_label(c, "Product promise", 0.5 * inch, PAGE_H - 1.18 * inch)
    draw_text(c, "Scholarium does not reduce a learner to a grade. Teach links learning attempts, proof of mastery, strengths, projects, and context while leaving interpretation and decisions with people.",
              0.5 * inch, PAGE_H - 1.42 * inch, 9.9 * inch, 12, INK, "Helvetica-Bold", 17)
    cards_y = 2.45 * inch
    gap = 0.18 * inch
    cw = (PAGE_W - 1.0 * inch - 2 * gap) / 3
    card(c, 0.5 * inch, cards_y, cw, 2.15 * inch, "Empowerment",
         "Difficulties guide support. They never become a label for the learner. Strength observations retain evidence, contradiction, confidence, age, and correction.", CYAN, BLUE)
    card(c, 0.5 * inch + cw + gap, cards_y, cw, 2.15 * inch, "Edge-case first",
         "Essential paths are designed for deaf or signed use, non-verbal communication, autism calm, Tourette-safe timing, ADHD sprints, dyslexia, dyspraxia, keyboard, and screen reader access.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 0.5 * inch + 2 * (cw + gap), cards_y, cw, 2.15 * inch, "Evidence before claim",
         "Every completed capability requires a versioned contract, lifecycle handling, a direct test, and an explicit authority boundary. Real learner data remains blocked before EFVP.", colors.HexColor("#FFF1E8"), CORAL)
    c.setFillColor(NAVY)
    c.roundRect(0.5 * inch, 0.64 * inch, PAGE_W - inch, 1.35 * inch, 4, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(0.72 * inch, 1.58 * inch, "Current operating truth")
    draw_text(c, "The product is a validated pre-alpha on synthetic data. G11 integrity evidence is closed. G12 product story and documentation are closing. G13 quality and G14 operations remain required before exposure.",
              0.72 * inch, 1.30 * inch, PAGE_W - 1.45 * inch, 9.5, CYAN, leading=13)
    footer(c)
    c.showPage()

    # 3. Sitemap
    page_header(c, "One platform, three working surfaces", 3)
    draw_contain(c, img("apps/web/output/playwright/g12-app-sitemap-desktop.png"), 0.5 * inch, 0.65 * inch, 7.05 * inch, 5.55 * inch)
    card(c, 7.78 * inch, 4.18 * inch, 2.72 * inch, 1.55 * inch, "Scholarium",
         "Signal, projects, circles, recognitions, portfolio evidence, and multidimensional statistics.", CYAN, BLUE)
    card(c, 7.78 * inch, 2.42 * inch, 2.72 * inch, 1.55 * inch, "Teach",
         "Courses, recall, help levels, mastery evidence, sources, consent, and role-specific projections.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 7.78 * inch, 0.66 * inch, 2.72 * inch, 1.55 * inch, "AlgoQuest",
         "Durable, versioned, idempotent gateway between educational actions and bounded assistants.", colors.HexColor("#FFF1E8"), CORAL)
    footer(c)
    c.showPage()

    # 4. Working product
    page_header(c, "The application is the first screen", 4)
    section_label(c, "Learner workspace", 0.5 * inch, PAGE_H - 1.12 * inch)
    draw_contain(c, img("apps/web/output/playwright/g12-teach-desktop.png"), 0.5 * inch, 2.0 * inch, 7.25 * inch, 4.35 * inch)
    draw_contain(c, img("apps/web/output/playwright/g12-teach-mobile.png"), 7.93 * inch, 1.92 * inch, 2.45 * inch, 4.55 * inch)
    c.setFillColor(WHITE)
    c.setStrokeColor(LINE)
    c.roundRect(0.5 * inch, 0.64 * inch, 9.88 * inch, 0.98 * inch, 4, fill=1, stroke=1)
    draw_text(c, "The same Teach domain adapts to desktop and mobile. Stable navigation exposes course, portfolio, statistics, sources, and administration without splitting identity or duplicating the learner record.",
              0.7 * inch, 1.28 * inch, 9.48 * inch, 9.2, INK, leading=13)
    footer(c)
    c.showPage()

    # 5. Accessibility
    page_header(c, "Accessibility defines the baseline", 5)
    draw_contain(c, img("apps/web/output/playwright/g7/teach-accessibility-desktop-top.png"), 0.5 * inch, 2.35 * inch, 6.8 * inch, 3.95 * inch)
    draw_contain(c, img("apps/web/output/playwright/g7/teach-accessibility-mobile-controls.png"), 7.42 * inch, 2.2 * inch, 2.85 * inch, 4.2 * inch)
    labels = [
        ("No voice required", CYAN), ("No mouse required", MINT), ("Low surprise", colors.HexColor("#FFF1E8")),
        ("Adjustable sensory load", colors.HexColor("#F2EAF8"))
    ]
    x = 0.5 * inch
    for text, fill in labels:
        c.setFillColor(fill)
        c.roundRect(x, 0.78 * inch, 2.3 * inch, 0.75 * inch, 4, fill=1, stroke=0)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(x + 1.15 * inch, 1.08 * inch, text)
        x += 2.52 * inch
    footer(c)
    c.showPage()

    # 6. Social evidence
    page_header(c, "Progress becomes evidence, not popularity", 6)
    draw_contain(c, img("apps/web/output/playwright/g9/teach-portfolio-desktop.png"), 0.5 * inch, 2.0 * inch, 6.55 * inch, 4.45 * inch)
    draw_contain(c, img("apps/web/output/playwright/g9/teach-statistics-tablet.png"), 7.15 * inch, 1.98 * inch, 3.18 * inch, 4.5 * inch)
    card(c, 0.5 * inch, 0.62 * inch, 3.08 * inch, 1.08 * inch, "Growth stories",
         "Result, proof, context, and learner reflection stay connected.", CYAN, BLUE)
    card(c, 3.72 * inch, 0.62 * inch, 3.08 * inch, 1.08 * inch, "Project threads",
         "Milestones, versions, files, sources, and contributions show process.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 6.94 * inch, 0.62 * inch, 3.4 * inch, 1.08 * inch, "Honest difficulty",
         "Original expression is preserved; constructive reformulation remains optional.", colors.HexColor("#FFF1E8"), CORAL)
    footer(c)
    c.showPage()

    # 7. Architecture
    page_header(c, "Teach is a domain, not a second platform", 7)
    draw_contain(c, img("docs/teach/diagrams/01-platform-architecture/scholarium-teach-platform-architecture.png"),
                 0.55 * inch, 0.72 * inch, 7.65 * inch, 5.55 * inch)
    card(c, 8.38 * inch, 4.25 * inch, 2.05 * inch, 1.72 * inch, "Web boundary",
         "Cloudflare hosts the product surface. It does not import pluginpack, FfeD, HippoRAG, or research runtimes.", CYAN, BLUE)
    card(c, 8.38 * inch, 2.3 * inch, 2.05 * inch, 1.72 * inch, "Private gateway",
         "Gate5 applies versioned contracts, pseudonymization, integrity checks, expiry, and receipts.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 8.38 * inch, 0.35 * inch, 2.05 * inch, 1.72 * inch, "Human authority",
         "Assistants structure and retrieve. Learners and authorized people decide.", colors.HexColor("#FFF1E8"), CORAL)
    footer(c)
    c.showPage()

    # 8. Data lifecycle
    page_header(c, "The data lifecycle stays inspectable", 8)
    draw_contain(c, img("docs/teach/diagrams/02-data-lifecycle/scholarium-teach-data-lifecycle.png"),
                 0.55 * inch, 0.62 * inch, 4.65 * inch, 5.7 * inch)
    card(c, 5.55 * inch, 4.72 * inch, 4.85 * inch, 1.28 * inch, "Observe, do not label",
         "Raw attempts remain separate from observations, inferences, recommendations, and human decisions.", CYAN, BLUE)
    card(c, 5.55 * inch, 3.18 * inch, 4.85 * inch, 1.28 * inch, "Consent travels with purpose",
         "Learning, personalization, profiling, sharing, and media are distinct purposes with revocation and retention rules.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 5.55 * inch, 1.64 * inch, 4.85 * inch, 1.28 * inch, "Learner correction remains active",
         "Strength proposals may be accepted, reformulated, contested, expired, or deleted by the learner.", colors.HexColor("#FFF1E8"), CORAL)
    card(c, 5.55 * inch, 0.1 * inch, 4.85 * inch, 1.28 * inch, "Current boundary",
         "No real learner record enters this lifecycle before the EFVP and legal review close.", colors.HexColor("#F2EAF8"), colors.HexColor("#7654A6"))
    footer(c)
    c.showPage()

    # 9. Retrieval
    page_header(c, "Retrieval remains sourced and non-authoritative", 9)
    draw_contain(c, img("docs/teach/diagrams/03-rag-memory-flow/synthia-memorylake-and-hipporag-flow.png"),
                 0.55 * inch, 0.62 * inch, 4.65 * inch, 5.7 * inch)
    card(c, 5.55 * inch, 4.72 * inch, 4.85 * inch, 1.28 * inch, "Synthia classifies",
         "Source cards retain author, URL, licence, date, citation, rights, concepts, relations, and contradictions.", CYAN, BLUE)
    card(c, 5.55 * inch, 3.18 * inch, 4.85 * inch, 1.28 * inch, "MemoryLake locates",
         "The central gateway records trace links and graph locations. Plugins do not keep independent MEMOIRE.md files.", MINT, colors.HexColor("#3C8B6B"))
    card(c, 5.55 * inch, 1.64 * inch, 4.85 * inch, 1.28 * inch, "HippoRAG retrieves",
         "Approved, preparation, and quarantine graphs remain separate. Retrieval does not grant taxonomic authority.", colors.HexColor("#FFF1E8"), CORAL)
    card(c, 5.55 * inch, 0.1 * inch, 4.85 * inch, 1.28 * inch, "Codex or Gemini generates",
         "Generation stays in an authorized school route and must preserve citations, uncertainty, and human review.", colors.HexColor("#F2EAF8"), colors.HexColor("#7654A6"))
    footer(c)
    c.showPage()

    # 10. Authority and security
    page_header(c, "Authority and security boundaries are explicit", 10)
    draw_contain(c, img("docs/teach/diagrams/04-assistant-authority/assistant-cooperation-and-authority-boundaries.png"),
                 0.5 * inch, 0.58 * inch, 5.0 * inch, 5.75 * inch)
    draw_contain(c, img("docs/teach/diagrams/05-security-boundary/gate5-and-transitional-security-boundary.png"),
                 5.58 * inch, 0.58 * inch, 4.9 * inch, 5.75 * inch)
    footer(c)
    c.showPage()

    # 11. Contracts
    page_header(c, "Versioned contracts keep components replaceable", 11)
    contract_data = [
        ["Contract", "Purpose", "Boundary"],
        ["learning-attempt.v1", "Question, answer, help, delay", "No mastery by repetition alone"],
        ["mastery-evidence.v1", "Minimal proof and transfer", "Evidence remains inspectable"],
        ["strength-observation.v1", "Contextual strength proposal", "Contradiction, expiry, correction"],
        ["growth-story.v1", "Multidimensional success", "Proof and reflection remain linked"],
        ["Gate5 capability", "Private engine invocation", "Allowlist, integrity, expiry, receipt"]
    ]
    table = Table(contract_data, colWidths=[2.1 * inch, 3.25 * inch, 4.25 * inch], rowHeights=0.55 * inch)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.8), ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7)
    ]))
    table.wrapOn(c, PAGE_W, PAGE_H)
    table.drawOn(c, 0.65 * inch, 2.55 * inch)
    c.setFillColor(colors.HexColor("#FFF1E8"))
    c.roundRect(0.65 * inch, 0.78 * inch, 9.6 * inch, 1.25 * inch, 4, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.9 * inch, 1.63 * inch, "Compatibility rule")
    draw_text(c, "Cloudflare, FfeD, Python workers, Synthia, memory, retrieval, FNP-QNN, and media communicate through versioned adapters. Scholarium never imports research runtimes directly.",
              0.9 * inch, 1.34 * inch, 9.1 * inch, 9.2, INK, leading=13)
    footer(c)
    c.showPage()

    # 12. Evidence scorecard
    page_header(c, "Verified evidence stays scoped", 12)
    drawing = Drawing(460, 260)
    chart = VerticalBarChart()
    chart.x = 45
    chart.y = 35
    chart.height = 185
    chart.width = 365
    chart.data = [[337, 41, 12, 29]]
    chart.categoryAxis.categoryNames = ["Plugin tests", "Integrity", "Doctor", "FNP-QNN"]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 360
    chart.valueAxis.valueStep = 60
    chart.bars[0].fillColor = BLUE
    chart.bars[0].strokeColor = BLUE
    chart.categoryAxis.labels.fontName = "Helvetica"
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = "Helvetica"
    chart.valueAxis.labels.fontSize = 7
    drawing.add(chart)
    drawing.add(String(45, 238, "Independent engineering counts", fontName="Helvetica-Bold", fontSize=11, fillColor=NAVY))
    drawing.drawOn(c, 0.45 * inch, 2.55 * inch)
    evidence = [
        ["Surface", "Result", "Scope"],
        ["Pluginpack tests", "337 passed", "Local package"],
        ["Manifest integrity", "41 / 41", "Allowlisted manifests"],
        ["Plugin doctor", "12 / 12", "Health checks"],
        ["FNP-QNN bridge", "29 passed, 1 skipped", "Adapter integration"],
        ["Browser console", "0 errors", "Validated local paths"],
        ["Local D1", "34 migrations / 75 tables", "Development database"]
    ]
    table = Table(evidence, colWidths=[2.0 * inch, 1.8 * inch, 2.2 * inch], rowHeights=0.43 * inch)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"), ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5), ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7)
    ]))
    table.wrapOn(c, PAGE_W, PAGE_H)
    table.drawOn(c, 4.85 * inch, 2.78 * inch)
    c.setFillColor(colors.HexColor("#FFF1E8"))
    c.roundRect(0.55 * inch, 0.72 * inch, 9.9 * inch, 1.28 * inch, 4, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.78 * inch, 1.62 * inch, "Interpretation rule")
    draw_text(c, "Counts are not combined into a readiness percentage. A passing engineering result cannot override an open EFVP, privacy, authority, accessibility, failure, or deployment gate.",
              0.78 * inch, 1.34 * inch, 9.3 * inch, 9.2, INK, leading=13)
    footer(c)
    c.showPage()

    # 13. Risks and next gates
    page_header(c, "Open risks and next gates", 13)
    risks = [
        ("Privacy approval", "EFVP and legal review are not closed.", "Synthetic data only", CORAL),
        ("Quality breadth", "G13 full suites remain open.", "No completion claim", GOLD),
        ("Environment debt", "Central Pillow is inconsistent while media is active.", "Isolated QA runtime", BLUE),
        ("Deployment", "cPanel and Cloudflare paths are not prepared.", "Localhost only", colors.HexColor("#3C8B6B"))
    ]
    x_positions = [0.5, 3.15, 5.8, 8.45]
    for x_in, (title, body, control, accent) in zip(x_positions, risks):
        card(c, x_in * inch, 3.82 * inch, 2.35 * inch, 2.22 * inch, title, f"Risk\n{body}\n\nCurrent control\n{control}", WHITE, accent)
    c.setStrokeColor(MUTED)
    c.setLineWidth(1)
    c.line(1.05 * inch, 2.55 * inch, 9.95 * inch, 2.55 * inch)
    milestones = [
        (1.05, "NOW", "Close G12", "PDF, validation, evidence register"),
        (4.4, "NEXT", "Execute G13", "Contracts, privacy, accessibility, failure, load"),
        (8.05, "THEN", "Prepare G14", "Tunnel, metrics, recovery, deployment, final audit")
    ]
    for x_in, label, title, body in milestones:
        x = x_in * inch
        c.setFillColor(NAVY)
        c.circle(x, 2.55 * inch, 4, fill=1, stroke=0)
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 7)
        c.drawString(x - 0.05 * inch, 2.83 * inch, label)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x - 0.05 * inch, 2.18 * inch, title)
        draw_text(c, body, x - 0.05 * inch, 1.9 * inch, 2.6 * inch, 8, MUTED, leading=11)
    footer(c)
    c.showPage()

    # 14. Handoff
    page_header(c, "G12 handoff package", 14)
    deliverables = [
        ("5", "Diagram packages", "DOT, SVG, PNG, caption, alt text, manifest"),
        ("3", "Role guides", "Student, teacher, administrator DOCX"),
        ("2", "Executive decks", "Team Alignment and Operating Review PPTX"),
        ("1", "Corporate dossier", "This validated PDF")
    ]
    x = 0.55 * inch
    for value, title, body in deliverables:
        c.setFillColor(WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(x, 3.68 * inch, 2.4 * inch, 2.3 * inch, 4, fill=1, stroke=1)
        c.setFillColor(BLUE)
        c.setFont("Helvetica-Bold", 30)
        c.drawString(x + 0.18 * inch, 5.3 * inch, value)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 0.18 * inch, 4.92 * inch, title)
        draw_text(c, body, x + 0.18 * inch, 4.58 * inch, 2.02 * inch, 8.2, MUTED, leading=11)
        x += 2.58 * inch
    c.setFillColor(NAVY)
    c.roundRect(0.55 * inch, 0.72 * inch, 9.9 * inch, 2.3 * inch, 4, fill=1, stroke=0)
    c.setFillColor(CYAN)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(0.82 * inch, 2.58 * inch, "DECISION")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(0.82 * inch, 2.06 * inch, "Proceed to G13. Keep real learner data blocked.")
    draw_text(c, "The product story, visual system, contracts, diagrams, role guidance, and evidence review now describe one coherent Teach domain. The next claim must come from direct quality and security proof.",
              0.82 * inch, 1.55 * inch, 8.95 * inch, 10, CYAN, leading=14)
    footer(c)
    c.save()


if __name__ == "__main__":
    build()
    print(OUTPUT)
