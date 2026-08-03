import unittest
from datetime import datetime, timezone

from pydantic import ValidationError

from scholarium_teach_engine.canonical import canonical_json, digest
from scholarium_teach_engine.models import AttemptEnvelope


class CanonicalTests(unittest.TestCase):
    def test_dict_order_does_not_change_digest(self):
        self.assertEqual(digest({"b": 2, "a": 1}), digest({"a": 1, "b": 2}))

    def test_unicode_is_preserved(self):
        self.assertIn("Castellano", canonical_json({"language": "Castellano"}))

    def test_non_finite_number_is_rejected(self):
        with self.assertRaises(ValueError):
            canonical_json({"value": float("nan")})

    def test_unknown_attempt_field_is_rejected(self):
        with self.assertRaises(ValidationError):
            AttemptEnvelope.model_validate({"unexpected": True})

    def test_timezone_is_canonical_utc(self):
        value = canonical_json({"at": datetime(2026, 8, 2, tzinfo=timezone.utc)})
        self.assertIn("2026-08-02T00:00:00Z", value)


if __name__ == "__main__":
    unittest.main()
