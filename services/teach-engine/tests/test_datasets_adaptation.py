from scholarium_teach_engine.adaptation import LearnerModalityPreference, Modality, ModalityTrial, propose_modality, signal_for_trial
from scholarium_teach_engine.datasets import DatasetManifest, DatasetSlotStatus, IngestionStatus, LicenseRecord, inspect_shard, neutral_dataset_slots, receipt_for, validate_manifest


def test_exactly_five_neutral_dataset_slots_are_runtime_closed():
    slots = neutral_dataset_slots()
    assert len(slots) == 5
    assert {slot.slot_id for slot in slots} == {f"dataset-slot-{number}" for number in range(1, 6)}
    assert all(slot.status is DatasetSlotStatus.NEUTRAL and slot.runtime_access is False for slot in slots)


def test_unlicensed_content_is_rejected_and_pii_is_quarantined():
    rejected = inspect_shard(content=b"licensed later", mime_type="text/plain", encoding="utf-8", language="es-419", license_record=None)
    assert rejected.status is IngestionStatus.REJECTED
    assert "license_missing" in rejected.reasons
    quarantined = inspect_shard(content=b"contact parent@example.org", mime_type="text/plain", encoding="utf-8", language="es-419", license_record=None)
    assert quarantined.status is IngestionStatus.QUARANTINED
    receipt = receipt_for(receipt_id="receipt-1", slot_id="dataset-slot-1", shard_id="shard-1", intake=quarantined)
    assert receipt.content_sha256 == quarantined.content_sha256
    assert "parent@example.org" not in receipt.model_dump_json()


def test_manifest_requires_provenance_and_produces_a_digest():
    license_record = LicenseRecord(license_id="license-1", name="CC BY 4.0", url="https://creativecommons.org/licenses/by/4.0/", allows_derivatives=True, allows_redistribution=True, commercial_use_known=True)
    manifest = DatasetManifest(dataset_slot_id="dataset-slot-1", version="1.0.0", status=DatasetSlotStatus.NEUTRAL, sources=(), licenses=(license_record,), shards=())
    validated = validate_manifest(manifest)
    assert validated.manifest_digest is not None


def test_presentation_offer_requires_acceptance_and_preserves_order():
    preference = LearnerModalityPreference(learner_pseudonym="learner-1", modality=Modality.SOUND, declared_preference="prefer", consented_at="2026-08-02T12:00:00Z", expires_at="2026-08-03T12:00:00Z")
    trial = ModalityTrial(trial_id="trial-1", learner_pseudonym="learner-1", node_id="syllable-ma-series", modality=Modality.SOUND, success=True, delay_ms=200, requested_help=False, delayed_recall=True, transfer=True, explicitly_refused=False)
    offer = propose_modality((trial,), preference, Modality.TEXT)
    assert offer is not None
    assert offer.requires_explicit_acceptance is True
    assert offer.changes_pedagogical_order is False
    signal = signal_for_trial(tenant_id="teach-alpha", source_tool="scholarium-teach", trial=trial, emitted_at="2026-08-02T12:00:00Z", expires_at="2026-08-03T12:00:00Z")
    assert signal.has_raw_answer is False and signal.has_diagnosis is False and signal.persistence_authorized is False
