"""Pinata IPFS folder uploads for Voxel Vault.

Uses Pinata's pinFileToIPFS endpoint because it returns a directory CID when
multiple files are uploaded together. Batches keep requests below typical
multipart/request limits.
"""

import json
import os
import time
from pathlib import Path
from typing import Dict, List

import requests


class PinataUploader:
    URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

    def __init__(self, jwt: str | None = None, timeout: int = 300, retries: int = 4):
        self.jwt = jwt or os.getenv("PINATA_JWT")
        if not self.jwt:
            raise ValueError("PINATA_JWT is required")
        self.timeout = timeout
        self.retries = retries

    def upload_folder_batch(self, files: List[Path], root_name: str) -> str:
        if not files:
            raise ValueError("No files supplied")
        headers = {"Authorization": f"Bearer {self.jwt}"}
        opened = []
        try:
            multipart = []
            for path in files:
                handle = path.open("rb")
                opened.append(handle)
                relative = f"{root_name.rstrip('/')}/{path.name}"
                mime = "application/json" if path.suffix == ".json" else "image/png"
                multipart.append(("file", (relative, handle, mime)))

            payload = {"pinataOptions": json.dumps({"cidVersion": 1}), "pinataMetadata": json.dumps({"name": root_name})}
            last_error = None
            for attempt in range(self.retries):
                try:
                    response = requests.post(self.URL, files=multipart, data=payload, headers=headers, timeout=self.timeout)
                    if response.ok:
                        data = response.json()
                        return data["IpfsHash"]
                    last_error = RuntimeError(f"Pinata {response.status_code}: {response.text[:500]}")
                except requests.RequestException as exc:
                    last_error = exc
                time.sleep(min(2 ** attempt, 16))
            raise RuntimeError(f"Pinata upload failed after {self.retries} attempts: {last_error}")
        finally:
            for handle in opened:
                handle.close()

    def upload_directory(self, directory: Path, batch_size: int = 500) -> Dict[int, str]:
        files = sorted(p for p in directory.iterdir() if p.is_file())
        mapping: Dict[int, str] = {}
        for offset in range(0, len(files), batch_size):
            batch = files[offset:offset + batch_size]
            cid = self.upload_folder_batch(batch, f"batch-{offset // batch_size:04d}")
            for path in batch:
                token_id = int(path.stem)
                mapping[token_id] = f"ipfs://{cid}/{path.name}"
            print(f"Uploaded {min(offset + batch_size, len(files)):,}/{len(files):,} -> {cid}")
        return mapping


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
