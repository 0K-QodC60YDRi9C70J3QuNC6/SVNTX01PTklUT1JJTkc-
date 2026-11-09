async function request(path, signal) {
  const response = await fetch(`/api/iss/${path}`, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const message = problem?.detail || `Сервер недоступен (HTTP ${response.status}).`;

    throw new Error(message);
  }

  return response.json();
}

export function getCurrent(signal) {
  return request('current', signal);
}

export function getHistory({ untilId, afterId = 0 }, signal) {
  const params = new URLSearchParams({
    limit: '1000',
    size: '100',
    afterId: String(afterId),
  });

  if (untilId !== undefined) {
    params.set('untilId', String(untilId));
  }

  return request(`history?${params}`, signal);
}
