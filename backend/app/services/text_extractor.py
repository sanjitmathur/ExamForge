"""Extract text from PDF, DOCX, and image files."""

import logging
from pathlib import Path

log = logging.getLogger(__name__)


def extract_text(file_path: Path, file_type: str) -> str:
    file_type = file_type.lower()
    if file_type == "pdf":
        return _extract_pdf(file_path)
    elif file_type == "docx":
        return _extract_docx(file_path)
    elif file_type in ("jpg", "jpeg", "png"):
        return _extract_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def _extract_pdf(file_path: Path) -> str:
    # Try pdfplumber first
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(str(file_path)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_parts.append(t)
        text = "\n\n".join(text_parts)
        if text.strip():
            return text
    except Exception as e:
        log.warning("pdfplumber failed, trying PyMuPDF: %s", e)

    # Fallback to PyMuPDF
    import fitz  # PyMuPDF
    doc = fitz.open(str(file_path))
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n\n".join(text_parts)


def _extract_docx(file_path: Path) -> str:
    from docx import Document
    doc = Document(str(file_path))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_image(file_path: Path) -> str:
    try:
        import pytesseract
        from PIL import Image
        img = Image.open(str(file_path))
        return pytesseract.image_to_string(img)
    except ImportError:
        raise RuntimeError("pytesseract or Pillow is not installed. Install them for OCR support.")
