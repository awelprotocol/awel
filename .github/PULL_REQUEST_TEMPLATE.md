# Pull request

## Summary

<!-- What does this change and why? Link the issue or RFC it implements. -->

Closes #

## Layer(s) touched

- [ ] Identity
- [ ] Discovery
- [ ] Payments (x402 / MPP channels / settlement)
- [ ] Tasks
- [ ] Receipts
- [ ] Reputation
- [ ] SDK / CLI / tooling (no protocol change)

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] Feature (non-breaking)
- [ ] Breaking change (wire protocol or SDK surface)
- [ ] Spec / RFC change
- [ ] Docs only

## Checklist

- [ ] `npm run lint` and `npm test` pass locally
- [ ] New behavior is covered by tests
- [ ] Spec under `/spec` updated if the wire protocol changed
- [ ] No secrets, keys, or `traces/` artifacts committed
- [ ] Backwards-compatibility / migration notes added for breaking changes

## Security considerations

<!-- Any impact on signing, channel funds, settlement, or reputation scoring?
     If this touches src/reputation or src/zk, call it out explicitly. -->
