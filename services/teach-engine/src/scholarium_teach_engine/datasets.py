"""Neutral, provenance-first dataset intake for the Teach engine.

These contracts prepare five empty slots. They do not name a corpus, fetch a
source, or make dataset content available to a learning block.
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from enum import Enum
from pydantic import Field, StringConstraints

from .canonical import digest
from .models import Sha256, StableId, StrictModel


SemVer = StringConstraints(pattern=r"^\d+\.\d+\.\d+$")
MimeType = StringConstraints(pattern=r"^[a-z]+/[a-z0-9.+-]+$")
LanguageTag = StringConstraints(pattern=r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")

MAX_SHARD_BYTES = 10 * 1024 * 1024 * 1024
ALLOWED_MIME_TYPES = frozenset({"application/json", "application/jsonl", "text/csv", "text/plain", "application/zip"})
EMAIL_PATTERN = re.compile(rb"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(rb"(?<!\d)(?:\+?\d[ .()-]?){8,16}\d(?!\d)")


class DatasetSlotStatus(str, Enum):
    NEUTRAL = "neutral"
    READY_FOR_RESEARCH = "ready_for_research"
    ACTIVE = "active"
    RETIRED = "retired"


class IngestionStatus(str, Enum):
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    QUARANTINED = "quarantined"


class DatasetSlot(StrictModel):
    slot_id: StableId
    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    status: DatasetSlotStatus = DatasetSlotStatus.NEUTRAL
    purpose: str = Field(min_length=1, max_length=240)
    runtime_access: bool = False


class LicenseRecord(StrictModel):
    license_id: StableId
    name: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=8, max_length=1_000)
    allows_derivatives: bool
    allows_redistribution: bool
    commercial_use_known: bool
    reviewed_by: str | None = Field(default=None, max_length=180)


class SourceRecord(StrictModel):
    source_id: StableId
    source_url: str = Field(min_length=8, max_length=2_000)
    retrieved_at: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}T")
    author: str | None = Field(default=None, max_length=500)
    license_id: StableId
    source_sha256: Sha256


class CorpusShard(StrictModel):
    shard_id: StableId
    dataset_slot_id: StableId
    content_sha256: Sha256
    compression: str = Field(pattern=r"^(none|gzip|zstd|zip)$")
    mime_type: str = Field(pattern=r"^[a-z]+/[a-z0-9.+-]+$")
    language: str = Field(pattern=r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")
    bytes_uncompressed: int = Field(ge=0, le=MAX_SHARD_BYTES)
    bytes_compressed: int = Field(ge=0, le=MAX_SHARD_BYTES)
    source_id: StableId


class DatasetManifest(StrictModel):
    schema_id: str = "scholarium.teach.dataset-manifest.v1"
    dataset_slot_id: StableId
    version: str = Field(pattern=r"^\d+\.\d+\.\d+$")
    status: DatasetSlotStatus
    sources: tuple[SourceRecord, ...]
    licenses: tuple[LicenseRecord, ...]
    shards: tuple[CorpusShard, ...]
    manifest_digest: Sha256 | None = None
    editorial_approved: bool = False


class IngestionReceipt(StrictModel):
    schema_id: str = "scholarium.teach.ingestion-receipt.v1"
    receipt_id: StableId
    dataset_slot_id: StableId
    shard_id: StableId
    status: IngestionStatus
    content_sha256: Sha256
    reason_codes: tuple[str, ...]
    receipt_digest: Sha256


@dataclass(frozen=True)
class IntakeResult:
    status: IngestionStatus
    reasons: tuple[str, ...]
    content_sha256: str


def neutral_dataset_slots() -> tuple[DatasetSlot, ...]:
    return tuple(
        DatasetSlot(slot_id=f"dataset-slot-{number}", version="1.0.0", purpose="Reserved pending research, source review, and license approval.")
        for number in range(1, 6)
    )


def inspect_shard(*, content: bytes, mime_type: str, encoding: str, language: str, license_record: LicenseRecord | None) -> IntakeResult:
    """Classify intake deterministically; no PII is copied into the receipt."""
    reasons: list[str] = []
    content_sha256 = f"sha256:{hashlib.sha256(content).hexdigest()}"
    if len(content) > MAX_SHARD_BYTES:
        reasons.append("shard_too_large")
    if mime_type not in ALLOWED_MIME_TYPES:
        reasons.append("mime_not_allowed")
    if encoding.lower() not in {"utf-8", "utf8", "binary"}:
        reasons.append("encoding_not_allowed")
    if not re.fullmatch(r"[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*", language):
        reasons.append("language_tag_invalid")
    if license_record is None:
        reasons.append("license_missing")
    elif not license_record.allows_derivatives or not license_record.allows_redistribution:
        reasons.append("license_not_compatible")
    if EMAIL_PATTERN.search(content) or PHONE_PATTERN.search(content):
        reasons.append("possible_pii")
        return IntakeResult(IngestionStatus.QUARANTINED, tuple(reasons), content_sha256)
    return IntakeResult(IngestionStatus.REJECTED if reasons else IngestionStatus.ACCEPTED, tuple(reasons), content_sha256)


def receipt_for(*, receipt_id: str, slot_id: str, shard_id: str, intake: IntakeResult) -> IngestionReceipt:
    unsigned = {"receipt_id": receipt_id, "dataset_slot_id": slot_id, "shard_id": shard_id, "status": intake.status.value, "content_sha256": intake.content_sha256, "reason_codes": intake.reasons}
    return IngestionReceipt(**unsigned, receipt_digest=digest(unsigned))


def validate_manifest(manifest: DatasetManifest) -> DatasetManifest:
    if manifest.schema_id != "scholarium.teach.dataset-manifest.v1":
        raise ValueError("unknown_dataset_manifest_schema")
    if len(manifest.sources) != len({source.source_id for source in manifest.sources}):
        raise ValueError("duplicate_source_id")
    if len(manifest.licenses) != len({license.license_id for license in manifest.licenses}):
        raise ValueError("duplicate_license_id")
    license_ids = {license.license_id for license in manifest.licenses}
    source_ids = {source.source_id for source in manifest.sources}
    if any(source.license_id not in license_ids for source in manifest.sources):
        raise ValueError("source_license_missing")
    if any(shard.source_id not in source_ids or shard.dataset_slot_id != manifest.dataset_slot_id for shard in manifest.shards):
        raise ValueError("invalid_shard_provenance")
    unsigned = manifest.model_dump(mode="json", exclude={"manifest_digest"})
    expected = digest(unsigned)
    if manifest.manifest_digest is not None and manifest.manifest_digest != expected:
        raise ValueError("manifest_digest_mismatch")
    return manifest.model_copy(update={"manifest_digest": expected})


def approved_for_pack(manifest: DatasetManifest) -> bool:
    """Only an explicitly active and editorially approved projection can feed a pack."""
    return manifest.status is DatasetSlotStatus.ACTIVE and manifest.editorial_approved and bool(manifest.shards)
