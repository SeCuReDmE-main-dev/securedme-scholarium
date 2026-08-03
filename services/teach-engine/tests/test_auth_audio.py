import io
import struct
import unittest
import wave

from scholarium_teach_engine.audio import observe_wav
from scholarium_teach_engine.auth import ReplayLedger, signature, verify


def wav_fixture(amplitude=3000, frames=4000, rate=16000):
    stream = io.BytesIO()
    with wave.open(stream, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(b"".join(struct.pack("<h", amplitude if index % 2 else -amplitude) for index in range(frames)))
    return stream.getvalue()


class AuthAudioTests(unittest.TestCase):
    def test_hmac_detects_tampering(self):
        secret = "s" * 32
        signed = signature(secret, "POST", "/internal/v1/decisions", 100, "nonce-1", b"{}")
        self.assertTrue(verify(secret, signed, "POST", "/internal/v1/decisions", 100, "nonce-1", b"{}"))
        self.assertFalse(verify(secret, signed, "POST", "/internal/v1/decisions", 100, "nonce-1", b"{\"x\":1}"))

    def test_replay_is_rejected(self):
        ledger = ReplayLedger()
        self.assertTrue(ledger.admit("nonce-1", 100, now=100))
        self.assertFalse(ledger.admit("nonce-1", 100, now=101))

    def test_minor_audio_is_blocked(self):
        observation = observe_wav("audio-1", wav_fixture(), consent=True, subject_kind="minor")
        self.assertEqual(observation.reason, "minor_pilot_blocked")

    def test_low_signal_abstains(self):
        observation = observe_wav("audio-2", wav_fixture(amplitude=1), consent=True, subject_kind="synthetic")
        self.assertEqual(observation.status, "abstain")

    def test_audio_never_changes_mastery_or_retains_sample(self):
        observation = observe_wav("audio-3", wav_fixture(), consent=True, subject_kind="consenting_adult")
        self.assertFalse(observation.can_change_mastery)
        self.assertFalse(observation.sample_retained)


if __name__ == "__main__":
    unittest.main()
