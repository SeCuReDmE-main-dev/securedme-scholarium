# Interfaces

- **Local proof editor:** use only through the documented repository route.
- **POST /verify:** use only through the documented repository route.
- **POST /route:** use only through the documented repository route.
- **POST /draft:** use only through the documented repository route.
- **Optional HippoRAG retrieval:** use only through the documented repository route.

## Interface contract

Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.

## Compatibility

Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.
