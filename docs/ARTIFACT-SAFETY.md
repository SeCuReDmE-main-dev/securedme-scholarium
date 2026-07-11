# Scholarium artifact safety boundary

Direct artifact uploads are capped at 25 MiB and only accept an explicit allow-list of document, archive, text, and video formats. The upload contract checks filename extension, declared MIME type, and a small format signature before R2 storage.

HTML-like text, XML/SVG-like text, executable content, empty files, mismatched signatures, and duplicate SHA-256 artifacts for the same publication are rejected. Server errors are logged without returning internal implementation details to the user.

This is an ingress safety boundary, not a claim that a file is malware-free. Malware scanning, deep document extraction, previews, and resumable large-media upload remain separate asynchronous launch gates.
