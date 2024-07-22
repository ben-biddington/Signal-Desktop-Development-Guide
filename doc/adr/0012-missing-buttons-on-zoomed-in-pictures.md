# 12. Missing buttons on zoomed-in pictures

Date: 2024-07-19

## Status

Accepted

## Context

[Missing buttons on zoomed-in pictures](https://github.com/signalapp/Signal-Desktop/issues/6852)(6-Apr-2024)

## Decision

See if we can fix this.

Very easy to reproduce, just paste an image into a conversation.

### Lightbox

`ts/components/Lightbox.tsx`

The controls _are_ there, it's just they are invisible.

## Consequences

What becomes easier or more difficult to do and any risks introduced by the change that will need to be mitigated.
