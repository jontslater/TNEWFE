/**
 * Legacy OBS overlay routes redirect to CleanBattlefieldSource while preserving query params.
 */
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

export function LegacyIdleOverlayRedirect() {
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  const target = query ? `/clean-battlefield?${query}` : '/clean-battlefield';
  return <Navigate to={target} replace />;
}

export function LegacyRaidOverlayRedirect() {
  const { instanceId } = useParams();
  const [searchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  if (instanceId) {
    params.set('forceMode', 'raid');
    params.set('forceInstanceId', instanceId);
  }
  const query = params.toString();
  const target = query ? `/clean-battlefield?${query}` : '/clean-battlefield';
  return <Navigate to={target} replace />;
}
