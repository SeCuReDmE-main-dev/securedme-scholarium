# Interfaces

- **synthia CLI:** use only through the documented repository route.
- **Static trace lab:** use only through the documented repository route.
- **Candidate-memory manifest:** use only through the documented repository route.
- **Optional RethinkDB adapter:** use only through the documented repository route.

## Interface contract

Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.

## Compatibility

Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.
