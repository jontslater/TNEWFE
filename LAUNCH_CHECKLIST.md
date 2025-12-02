# Browser Source Launch Checklist

## Pre-Launch Testing

### Critical Systems
- [ ] All test suite tests pass (90%+ pass rate)
- [ ] Death animations work 100% of the time
- [ ] No duplicate enemy attacks observed
- [ ] Combat stops correctly in all scenarios
- [ ] Wave counter increments correctly
- [ ] Debuff display works consistently
- [ ] No memory leaks detected (30+ min sessions)
- [ ] Performance is acceptable (60fps during combat)

### UI Features
- [ ] Quest progress display implemented and working
- [ ] Viewer benefits display implemented and working
- [ ] Difficulty indicator implemented and working
- [ ] Wave counter display implemented and working
- [ ] Auto-buy status notifications working
- [ ] All SCT notifications display correctly
- [ ] Health bars update smoothly
- [ ] Buff/debuff displays work consistently

### State Consistency
- [ ] HP is always an integer
- [ ] isDead matches HP state (HP <= 0 means isDead = true)
- [ ] No race conditions in combat loop
- [ ] Proper cleanup on combat end
- [ ] All intervals cleared on stopCombat()

### Error Handling
- [ ] No critical console errors in normal operation
- [ ] Error boundaries in place for React components
- [ ] Graceful handling of missing data
- [ ] Fallbacks for network errors

## Post-Launch Monitoring

### Performance Metrics
- [ ] Monitor frame rate during combat
- [ ] Check memory usage over time
- [ ] Verify no memory leaks in long sessions
- [ ] Monitor network request frequency

### User Experience
- [ ] Verify all UI elements are visible
- [ ] Check that animations play smoothly
- [ ] Ensure combat text displays correctly
- [ ] Verify quest progress updates correctly

## Known Limitations

1. **Debuff Display**: May occasionally not show due to timing issues with DOM updates
2. **Animation Timing**: Some animations may be slightly out of sync during rapid state changes
3. **Network Dependencies**: Requires stable connection to Firebase for battlefield state

## Rollback Plan

If critical issues are discovered post-launch:
1. Disable browser source in OBS
2. Revert to previous stable version
3. Investigate and fix issues
4. Re-test before re-enabling

## Success Criteria

The browser source is ready for launch when:
- ✅ All critical systems pass testing
- ✅ All UI features are implemented and working
- ✅ No critical bugs remain
- ✅ Performance is acceptable
- ✅ Error handling is robust

