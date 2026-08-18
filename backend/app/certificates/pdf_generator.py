"""
CertiSecure2 — PDF Certificate Generator

Generates professional certificate PDFs using ReportLab.
Embeds QR code for instant verification.
"""

import hashlib
from pathlib import Path
from typing import Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas

from app.core.config import settings


def _hex_to_color(hex_str: str) -> colors.Color:
    """Convert hex color string to ReportLab Color."""
    hex_str = hex_str.lstrip("#")
    r = int(hex_str[0:2], 16) / 255
    g = int(hex_str[2:4], 16) / 255
    b = int(hex_str[4:6], 16) / 255
    return colors.Color(r, g, b)


def compute_pdf_hash(filepath: Path) -> str:
    """Compute SHA-256 hex digest of a PDF file."""
    if not filepath.exists():
        return ""
    return hashlib.sha256(filepath.read_bytes()).hexdigest()


def generate_certificate_pdf(
    certificate_uid: str,
    holder_name: str,
    course: str,
    institution_name: str,
    issue_date: str,
    roll_number: Optional[str] = None,
    certificate_type: str = "Completion",
    grade: Optional[str] = None,
    description: Optional[str] = None,
    qr_path: Optional[str] = None,
) -> Tuple[str, str]:
    """
    Generate a professional certificate PDF.
    Returns tuple of (relative_pdf_path, pdf_sha256_hash).
    """
    primary = _hex_to_color("#1e3a5f")
    secondary = _hex_to_color("#2563eb")

    page_width, page_height = landscape(A4)

    pdf_dir = settings.certificate_dir / "pdf"
    pdf_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{certificate_uid}.pdf"
    filepath = pdf_dir / filename

    c = canvas.Canvas(str(filepath), pagesize=landscape(A4))
    c.setTitle(f"Certificate - {certificate_uid}")
    c.setAuthor(institution_name)
    c.setSubject(f"UID:{certificate_uid}|HOLDER:{holder_name}|COURSE:{course}|GRADE:{grade or ''}")

    # ---- Background ----
    c.setFillColor(colors.white)
    c.rect(0, 0, page_width, page_height, fill=1)

    # ---- Borders ----
    border_margin = 20
    c.setStrokeColor(primary)
    c.setLineWidth(3)
    c.rect(border_margin, border_margin, page_width - 2 * border_margin, page_height - 2 * border_margin)

    c.setStrokeColor(secondary)
    c.setLineWidth(1)
    c.rect(border_margin + 8, border_margin + 8, page_width - 2 * (border_margin + 8), page_height - 2 * (border_margin + 8))

    # Top decorative line
    y_top_line = page_height - 80
    c.setStrokeColor(secondary)
    c.setLineWidth(2)
    c.line(80, y_top_line, page_width - 80, y_top_line)

    # ---- Institution Name ----
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(page_width / 2, page_height - 70, institution_name)

    # ---- Certificate Type Title ----
    cert_title_str = f"CERTIFICATE OF {certificate_type.upper()}"
    c.setFillColor(secondary)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(page_width / 2, y_top_line - 30, cert_title_str)

    # ---- Subtitle ----
    c.setFillColor(colors.Color(0.3, 0.3, 0.3))
    c.setFont("Helvetica", 12)
    c.drawCentredString(page_width / 2, y_top_line - 50, "This is proudly presented to")

    # ---- Holder Name ----
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(page_width / 2, y_top_line - 85, holder_name)

    # Underline
    name_width = c.stringWidth(holder_name, "Helvetica-Bold", 30)
    c.setStrokeColor(secondary)
    c.setLineWidth(1.5)
    c.line(
        (page_width - name_width) / 2 - 20,
        y_top_line - 90,
        (page_width + name_width) / 2 + 20,
        y_top_line - 90,
    )

    # ---- Roll Number (if provided) ----
    y_curr = y_top_line - 110
    if roll_number:
        c.setFillColor(colors.Color(0.4, 0.4, 0.4))
        c.setFont("Helvetica", 11)
        c.drawCentredString(page_width / 2, y_curr, f"Roll / Reg No: {roll_number}")
        y_curr -= 20

    # ---- Award Text ----
    c.setFillColor(colors.Color(0.2, 0.2, 0.2))
    c.setFont("Helvetica", 13)
    c.drawCentredString(page_width / 2, y_curr, "for successfully completing the course/program")

    # ---- Course Name ----
    y_curr -= 30
    c.setFillColor(secondary)
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(page_width / 2, y_curr, course)

    # ---- Grade ----
    y_curr -= 25
    if grade:
        c.setFillColor(colors.Color(0.3, 0.3, 0.3))
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(page_width / 2, y_curr, f"Result / Grade: {grade}")
        y_curr -= 20

    # ---- Description ----
    if description:
        c.setFillColor(colors.Color(0.4, 0.4, 0.4))
        c.setFont("Helvetica", 10)
        max_w = page_width - 200
        words = description.split()
        line = ""
        for w in words:
            test = f"{line} {w}".strip()
            if c.stringWidth(test, "Helvetica", 10) < max_w:
                line = test
            else:
                c.drawCentredString(page_width / 2, y_curr, line)
                y_curr -= 14
                line = w
        if line:
            c.drawCentredString(page_width / 2, y_curr, line)
            y_curr -= 14

    # ---- Issue Date ----
    c.setFillColor(colors.Color(0.3, 0.3, 0.3))
    c.setFont("Helvetica", 11)
    c.drawCentredString(page_width / 2, y_curr - 10, f"Issued on: {issue_date}")

    # Bottom decorative line
    y_bottom_line = border_margin + 100
    c.setStrokeColor(secondary)
    c.setLineWidth(1.5)
    c.line(80, y_bottom_line, page_width - 80, y_bottom_line)

    # ---- Signatures ----
    sig_y = border_margin + 55
    c.setStrokeColor(primary)
    c.setLineWidth(1)
    c.line(120, sig_y + 20, 300, sig_y + 20)
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(210, sig_y + 5, "Authorized Signatory")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.Color(0.4, 0.4, 0.4))
    c.drawCentredString(210, sig_y - 8, "Controller of Examinations")

    c.setStrokeColor(primary)
    c.line(page_width - 300, sig_y + 20, page_width - 120, sig_y + 20)
    c.setFillColor(primary)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(page_width - 210, sig_y + 5, institution_name)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.Color(0.4, 0.4, 0.4))
    c.drawCentredString(page_width - 210, sig_y - 8, "Issuing Institution")

    # ---- QR Code ----
    if qr_path:
        qr_full_path = settings.storage_dir / qr_path
        if qr_full_path.exists():
            qr_size = 75
            c.drawImage(
                str(qr_full_path),
                page_width / 2 - qr_size / 2,
                border_margin + 30,
                width=qr_size,
                height=qr_size,
                preserveAspectRatio=True,
            )

    # ---- Footer ----
    footer_text = f"Certificate ID: {certificate_uid} | Verify at {settings.frontend_url}/verify/{certificate_uid}"
    c.setFillColor(colors.Color(0.5, 0.5, 0.5))
    c.setFont("Helvetica", 7)
    c.drawCentredString(page_width / 2, border_margin + 12, footer_text)

    c.setFillColor(colors.Color(0.9, 0.9, 0.9))
    c.setFont("Helvetica", 8)
    c.drawString(border_margin + 15, border_margin + 12, certificate_uid)

    c.setFillColor(colors.Color(0.7, 0.7, 0.7))
    c.setFont("Helvetica", 7)
    c.drawRightString(page_width - border_margin - 15, border_margin + 12, "Protected by CertiSecure2")

    c.save()

    pdf_hash = compute_pdf_hash(filepath)
    rel_path = f"certificates/pdf/{filename}"

    return rel_path, pdf_hash
