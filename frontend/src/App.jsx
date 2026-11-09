import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

import { getCurrent, getHistory } from './api.js';
import { distanceKm, splitRoute } from './mapUtils.js';

const storageKey = 'iss-tracker-location';

const number = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
});

const time = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const stationSvg = `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="m12 10 18 18M10 12l18 18" stroke="white" stroke-width="3" />
  <path
    d="m8 20 12-12 5 5-12 12zm7 7 12-12 5 5-12 12z"
    fill="#8be6f4"
    stroke="#101b2b"
    stroke-width="1.5"
  />
  <path d="m17 18 5 5m-6-2 5-5" stroke="white" stroke-width="4" />
</svg>`;

const stationIcon = L.divIcon({
  className: 'station-marker',
  html: stationSvg,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function readLocation() {
  try {
    const point = JSON.parse(localStorage.getItem(storageKey));

    if (
      point
      && Number.isFinite(point.latitude)
      && Math.abs(point.latitude) <= 90
      && Number.isFinite(point.longitude)
      && Math.abs(point.longitude) <= 180
    ) {
      return point;
    }
  } catch {
  }

  return null;
}

function coordinates(point) {
  if (!point) {
    return '—';
  }

  return `${point.latitude.toFixed(4)}°, ${point.longitude.toFixed(4)}°`;
}

function MapView({ current, location, route, onPick, focus }) {
  const container = useRef(null);
  const map = useRef(null);
  const station = useRef(null);
  const user = useRef(null);
  const line = useRef(null);

  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    const instance = L.map(container.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 1,
      zoomControl: false,
    });

    map.current = instance;

    L.control.zoom({
      position: 'bottomright',
    }).addTo(instance);

    const tileUrl = import.meta.env.VITE_TILE_URL
      || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
    }).addTo(instance);

    tiles.on('tileerror', () => {
      setTileError(true);
    });

    tiles.on('load', () => {
      if (!container.current?.querySelector('.leaflet-tile-loaded')) {
        return;
      }

      setTileError(false);
    });

    line.current = L.polyline([], {
      color: '#08a4b5',
      weight: 3,
      opacity: 0.95,
    }).addTo(instance);

    instance.on('click', ({ latlng }) => {
      onPick({
        latitude: latlng.lat,
        longitude: ((latlng.lng + 180) % 360 + 360) % 360 - 180,
      });
    });

    const observer = new ResizeObserver(() => {
      instance.invalidateSize();
    });

    observer.observe(container.current);

    return () => {
      observer.disconnect();
      instance.remove();

      map.current = null;
      station.current = null;
      user.current = null;
    };
  }, [onPick]);

  useEffect(() => {
    if (!map.current || !current) {
      return;
    }

    const position = [current.latitude, current.longitude];

    if (!station.current) {
      station.current = L.marker(position, {
        icon: stationIcon,
        title: 'Текущее положение МКС',
      })
        .bindTooltip('МКС')
        .addTo(map.current);
    } else {
      station.current.setLatLng(position);
    }
  }, [current]);

  useEffect(() => {
    if (!map.current) {
      return;
    }

    if (!location) {
      user.current?.remove();
      user.current = null;

      return;
    }

    const position = [location.latitude, location.longitude];

    if (!user.current) {
      user.current = L.marker(position, {
        icon: userIcon,
        title: 'Выбранное местоположение',
      })
        .bindTooltip('Ваша точка')
        .addTo(map.current);
    } else {
      user.current.setLatLng(position);
    }
  }, [location]);

  useEffect(() => {
    line.current?.setLatLngs(splitRoute(route));
  }, [route]);

  useEffect(() => {
    if (focus?.point) {
      map.current?.flyTo(
        [focus.point.latitude, focus.point.longitude],
        5,
        { duration: 0.7 },
      );
    }
  }, [focus]);

  return (
    <>
      <div
        ref={container}
        className="map"
        aria-label="Карта положения МКС. Выберите своё местоположение кликом."
      />

      {tileError && (
        <div className="tile-warning" role="status">
          Часть карты недоступна.
        </div>
      )}
    </>
  );
}

export default function App() {
  const [current, setCurrent] = useState(null);
  const [location, setLocation] = useState(readLocation);
  const [currentError, setCurrentError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [focus, setFocus] = useState(null);
  const [route, setRoute] = useState([]);

  const [history, setHistory] = useState({
    loading: false,
    total: 0,
    requested: false,
    error: '',
  });

  const historyAbort = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer;

    async function poll() {
      try {
        const measurement = await getCurrent(controller.signal);

        if (!controller.signal.aborted) {
          setCurrent(measurement);
          setCurrentError('');
        }
      } catch {
        if (!controller.signal.aborted) {
          setCurrentError('Не удалось обновить координаты.');
        }
      } finally {
        if (!controller.signal.aborted) {
          timer = setTimeout(poll, 5000);
        }
      }
    }

    poll();

    const clock = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    return () => {
      historyAbort.current?.abort();
    };
  }, []);

  const pickLocation = useCallback((point) => {
    setLocation(point);

    try {
      if (point) {
        localStorage.setItem(storageKey, JSON.stringify(point));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
    }
  }, []);

  async function loadHistory() {
    historyAbort.current?.abort();

    const controller = new AbortController();
    let untilId;
    let afterId = 0;
    let initialTotal;

    historyAbort.current = controller;

    setRoute([]);
    setHistory({
      loading: true,
      total: 0,
      requested: true,
      error: '',
    });

    try {
      let hasMore = true;

      while (hasMore && !controller.signal.aborted) {
        const page = await getHistory({ untilId, afterId }, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        if (initialTotal !== undefined && page.total !== initialTotal) {
          setRoute([]);

          throw new Error('История обновилась. Загрузите маршрут ещё раз.');
        }

        initialTotal = page.total;
        untilId = page.untilId;
        afterId = page.nextAfterId;
        hasMore = page.hasMore;

        setRoute((previous) => [...previous, ...page.points]);
        setHistory({
          loading: hasMore,
          total: page.total,
          requested: true,
          error: '',
        });

        await new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      let message = 'Не удалось загрузить маршрут. Попробуйте ещё раз.';

      if (error.message === 'История обновилась. Загрузите маршрут ещё раз.') {
        message = error.message;
      }

      setHistory((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
    }
  }

  function hideHistory() {
    historyAbort.current?.abort();

    setRoute([]);
    setHistory({
      loading: false,
      total: 0,
      requested: false,
      error: '',
    });
  }

  const age = current
    ? Math.max(0, Math.floor((now - Date.parse(current.measuredAt)) / 1000))
    : null;

  const stale = age !== null && age > 20;
  const live = current && !currentError && !stale;
  const distance = current && location ? distanceKm(location, current) : null;

  const latitudeLabel = current ? current.latitude.toFixed(4) : '—';
  const longitudeLabel = current ? current.longitude.toFixed(4) : '—';
  const measurementTime = current ? time.format(new Date(current.measuredAt)) : '—';
  const distanceLabel = distance === null ? '—' : number.format(distance);

  let connectionLabel = 'Ожидание данных';

  if (live) {
    connectionLabel = 'Данные актуальны';
  } else if (current) {
    connectionLabel = 'Нет обновлений';
  }

  let routeButtonLabel = 'Показать маршрут';

  if (history.loading) {
    routeButtonLabel = 'Загрузка…';
  } else if (history.requested) {
    routeButtonLabel = 'Обновить маршрут';
  }

  let routeStatus = 'Маршрут пока пуст';

  if (history.loading) {
    routeStatus = 'Загрузка…';

    if (history.total) {
      const progress = Math.round(route.length / history.total * 100);

      routeStatus = `${progress}%`;
    }
  } else if (history.error) {
    routeStatus = 'Загрузка прервана';
  } else if (route.length) {
    routeStatus = 'Маршрут показан';
  }

  const historyActionLabel = history.loading ? 'Отменить' : 'Скрыть';

  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="Орбита — главная">
          Орбита
        </a>

        <h1 className="header-caption">Трекер МКС</h1>

        <div className={`connection ${live ? 'online' : ''}`} role="status">
          <span />
          {connectionLabel}
        </div>
      </header>

      <main>
        <section className="workspace" aria-label="Отслеживание станции">
          <div className="map-panel">
            <div className="map-container">
              <MapView
                current={current}
                location={location}
                route={route}
                onPick={pickLocation}
                focus={focus}
              />

              <div className="map-actions">
                <button
                  disabled={!current}
                  onClick={() => setFocus({ point: current })}
                >
                  Найти МКС
                </button>

                <button
                  disabled={!location}
                  onClick={() => setFocus({ point: location })}
                >
                  Моя точка
                </button>
              </div>
            </div>

            <div className="map-legend">
              <span>
                <i className="legend-station" />
                МКС
              </span>

              <span>
                <i className="legend-user" />
                Ваша точка
              </span>

              <span>
                <i className="legend-route" />
                Пройденный путь
              </span>
            </div>
          </div>

          <aside className="sidebar">
            <section className="card position-card">
              <div className="card-heading">
                <h2>Координаты МКС</h2>
              </div>

              <div className="coordinate-grid">
                <div>
                  <span>Широта</span>
                  <strong>
                    {latitudeLabel}
                    <small>°</small>
                  </strong>
                </div>

                <div>
                  <span>Долгота</span>
                  <strong>
                    {longitudeLabel}
                    <small>°</small>
                  </strong>
                </div>
              </div>

              <div className="measurement-time">
                <span>Обновлено</span>
                <strong>{measurementTime}</strong>
              </div>

              {(currentError || stale) && (
                <p className="notice" role="status">
                  {currentError || `Нет обновлений ${number.format(age)} сек.`}
                </p>
              )}
            </section>

            <section className="card distance-card">
              <div className="card-heading">
                <h2>Расстояние до вас</h2>
              </div>

              <div className="distance-value">
                {distanceLabel}
                <span>км</span>
              </div>

              <p title="Расстояние до точки на поверхности Земли под МКС">
                По поверхности Земли
              </p>

              <div className="your-location">
                <span className="location-dot" />

                <div>
                  <span>Ваша точка</span>

                  {location ? (
                    <strong>{coordinates(location)}</strong>
                  ) : (
                    <p className="location-hint">Выберите место на карте</p>
                  )}
                </div>

                {location && (
                  <button
                    className="clear-location"
                    onClick={() => pickLocation(null)}
                    aria-label="Сбросить выбранное местоположение"
                  >
                    ×
                  </button>
                )}
              </div>

              {distance !== null && !live && (
                <p className="distance-warning">По последним данным</p>
              )}
            </section>

            <section className="card history-card">
              <div className="card-heading">
                <h2>Маршрут</h2>
              </div>

              <button
                className="primary-button"
                disabled={history.loading}
                onClick={loadHistory}
              >
                {routeButtonLabel}
              </button>

              {history.requested && (
                <div className="history-progress" role="status">
                  {history.loading && (
                    <progress
                      value={route.length}
                      max={history.total || 1}
                      aria-label="Загрузка маршрута"
                    />
                  )}

                  <div>
                    <span>{routeStatus}</span>

                    <button className="text-button" onClick={hideHistory}>
                      {historyActionLabel}
                    </button>
                  </div>
                </div>
              )}

              {history.error && (
                <p className="notice" role="alert">
                  {history.error}
                </p>
              )}
            </section>
          </aside>
        </section>

        <footer>
          <a href="https://open-notify.org/" target="_blank" rel="noreferrer">
            Open Notify
          </a>
        </footer>
      </main>
    </div>
  );
}
