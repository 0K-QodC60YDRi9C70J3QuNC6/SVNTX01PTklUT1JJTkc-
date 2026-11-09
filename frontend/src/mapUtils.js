function radians(degrees) {
  return degrees * Math.PI / 180;
}

export function distanceKm(from, to) {
  const deltaLatitude = radians(to.latitude - from.latitude);
  const deltaLongitude = radians(to.longitude - from.longitude);

  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(deltaLongitude / 2) ** 2;

  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function splitRoute(points) {
  const segments = [];
  let segment = [];

  points.forEach((point, index) => {
    const previous = points[index - 1];

    if (previous) {
      const difference = point.longitude - previous.longitude;

      if (Date.parse(point.measuredAt) - Date.parse(previous.measuredAt) > 30000) {
        if (segment.length) {
          segments.push(segment);
        }

        segment = [];
      } else if (Math.abs(difference) > 180) {
        const adjustedLongitude = point.longitude + (difference > 0 ? -360 : 360);
        const edge = difference > 0 ? -180 : 180;
        const fraction = (edge - previous.longitude) / (adjustedLongitude - previous.longitude);
        const latitude = previous.latitude + fraction * (point.latitude - previous.latitude);

        segment.push([latitude, edge]);
        segments.push(segment);

        segment = [[latitude, -edge]];
      }
    }

    segment.push([point.latitude, point.longitude]);
  });

  if (segment.length) {
    segments.push(segment);
  }

  return segments;
}
