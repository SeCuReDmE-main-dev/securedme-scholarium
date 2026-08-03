from __future__ import annotations

import hashlib
import hmac
import time
from dataclasses import dataclass, field


@dataclass
class ReplayLedger:
    ttl_seconds: int = 300
    _nonces: dict[str, float] = field(default_factory=dict)

    def admit(self, nonce: str, issued_at: int, now: int | None = None) -> bool:
        current = int(time.time()) if now is None else now
        self._nonces = {key: expiry for key, expiry in self._nonces.items() if expiry > current}
        if abs(current - issued_at) > self.ttl_seconds or nonce in self._nonces:
            return False
        self._nonces[nonce] = current + self.ttl_seconds
        return True


def signature(secret: str, method: str, path: str, issued_at: int, nonce: str, body: bytes) -> str:
    if len(secret) < 32:
        raise ValueError("HMAC secret must contain at least 32 characters")
    body_digest = hashlib.sha256(body).hexdigest()
    message = f"v1\n{method.upper()}\n{path}\n{issued_at}\n{nonce}\n{body_digest}".encode()
    return "hmac-sha256:" + hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def verify(secret: str, supplied: str, method: str, path: str, issued_at: int, nonce: str, body: bytes) -> bool:
    try:
        return hmac.compare_digest(supplied, signature(secret, method, path, issued_at, nonce, body))
    except ValueError:
        return False
