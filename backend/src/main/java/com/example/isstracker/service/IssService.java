package com.example.isstracker.service;

import com.example.isstracker.model.IssMeasurement;
import com.example.isstracker.repository.IssMeasurementRepository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IssService {

    private final IssMeasurementRepository repository;

    public IssService(IssMeasurementRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Measurement current() {
        return repository.findFirstByOrderByIdDesc()
                .map(Measurement::from)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Измерений пока нет. Сервер ожидает данные Open Notify."
                ));
    }

    @Transactional(readOnly = true)
    public HistoryPage history(int limit, int size, Long untilId, long afterId) {
        long snapshotId;

        if (untilId != null) {
            snapshotId = untilId;
        } else {
            snapshotId = repository.findFirstByOrderByIdDesc()
                    .map(IssMeasurement::getId)
                    .orElse(0L);
        }

        List<Measurement> snapshot = repository.findByIdLessThanEqualOrderByIdDesc(
                        snapshotId,
                        PageRequest.of(0, limit)
                )
                .reversed()
                .stream()
                .map(Measurement::from)
                .toList();

        List<Measurement> remaining = snapshot.stream()
                .filter(point -> point.id() > afterId)
                .toList();

        List<Measurement> points = remaining.stream()
                .limit(size)
                .toList();

        long nextAfterId = points.isEmpty() ? afterId : points.getLast().id();
        boolean hasMore = remaining.size() > points.size();

        return new HistoryPage(
                points,
                snapshotId,
                nextAfterId,
                hasMore,
                snapshot.size()
        );
    }

    public record Measurement(
            long id,
            double latitude,
            double longitude,
            Instant measuredAt
    ) {

        static Measurement from(IssMeasurement entity) {
            return new Measurement(
                    entity.getId(),
                    entity.getLatitude(),
                    entity.getLongitude(),
                    entity.getMeasuredAt()
            );
        }
    }

    public record HistoryPage(
            List<Measurement> points,
            long untilId,
            long nextAfterId,
            boolean hasMore,
            int total
    ) {
    }
}
