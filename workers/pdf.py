from pypdf import PdfReader, PdfWriter, PageRange
from pathlib import Path
import secrets


BASE = Path.cwd().parent


def is_valid_splits_arr(arr, count):
    # splits length <= pages count - 1
    # splits must be a sorted array of unique intigers.
    # min(splits) > 0 and max(splits) < len(reader.pages) 

    return True

def split_ranges(splits, pages_count):

    ranges = []
    prev = 0
    for i in splits:
        ranges.append(f"{ prev }:{ i }")
        prev = i
    
    ranges.append(f"{ prev }:{ pages_count}")

    return ranges


def split(file, splits):

    source = BASE / 'storage' / file['bucket'] / file['key']

    pages = PdfReader(source).pages
    count = len(pages)

    if not is_valid_splits_arr(splits, count):
        return False

    ranges = split_ranges(splits, count)

    parts = []
    order = 1

    for r in ranges:
        writer = PdfWriter()
        writer.append(source, pages=PageRange(r))

        key = f"{secrets.token_hex(16)}.pdf"
        distenation = BASE / 'storage' / 'processed' / key

        writer.write(distenation)
        
        parts.append({
            'key': key,
            'order': order
        })

        order += 1
    
    return parts


