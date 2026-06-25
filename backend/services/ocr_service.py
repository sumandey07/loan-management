import easyocr
import re
import os
from pdf2image import convert_from_path

_reader = easyocr.Reader(["en"], gpu=False)


def extract_text_from_image(file_path: str) -> str:
    """
    Supports image files AND PDFs
    """
    ext = os.path.splitext(file_path)[-1].lower()
    text_chunks = []

    # ---- PDF handling ----
    if ext == ".pdf":
        images = convert_from_path(file_path, dpi=300)
        for img in images:
            results = _reader.readtext(img, detail=0)
            text_chunks.extend(results)

    # ---- Image handling ----
    else:
        results = _reader.readtext(file_path, detail=0)
        text_chunks.extend(results)

    return " ".join(text_chunks)


def extract_pan_from_text(text: str) -> str | None:
    match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text.replace(" ", ""))
    return match.group() if match else None


def extract_aadhaar_from_text(text: str) -> str | None:
    match = re.search(r"\b[2-9][0-9]{11}\b", text.replace(" ", ""))
    return match.group() if match else None
