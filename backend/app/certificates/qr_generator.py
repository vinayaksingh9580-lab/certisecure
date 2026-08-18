"""
CertiSecure — QR Code Generator

Generates QR codes containing ONLY the verification URL.
No PII is embedded in the QR code.
"""

import os
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H

from app.core.config import settings


def generate_qr_code(certificate_uid: str) -> str:
    """
    Generate a QR code for certificate verification.

    The QR contains only a URL:
        {FRONTEND_URL}/verify/{certificate_uid}

    Args:
        certificate_uid: The unique certificate identifier

    Returns:
        Relative path to the generated QR code image
    """
    verification_url = f"{settings.frontend_url}/verify/{certificate_uid}"

    qr = qrcode.QRCode(
        version=None,  # Auto-size
        error_correction=ERROR_CORRECT_H,  # High error correction (30%)
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1e3a5f", back_color="white")

    # Save to storage
    qr_dir = settings.certificate_dir / "qr"
    qr_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{certificate_uid}.png"
    filepath = qr_dir / filename
    img.save(str(filepath))

    return f"certificates/qr/{filename}"


def generate_qr_bytes(certificate_uid: str) -> bytes:
    """Generate QR code and return as PNG bytes (for embedding in PDF)."""
    verification_url = f"{settings.frontend_url}/verify/{certificate_uid}"

    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=8,
        border=3,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1e3a5f", back_color="white")

    import io
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
