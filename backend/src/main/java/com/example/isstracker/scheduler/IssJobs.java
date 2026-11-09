package com.example.isstracker.scheduler;

import com.example.isstracker.client.OpenNotifyClient;
import com.example.isstracker.model.IssMeasurement;
import com.example.isstracker.repository.IssMeasurementRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class IssJobs {

    private static final Logger log = LoggerFactory.getLogger(IssJobs.class);

    private final OpenNotifyClient client;
    private final IssMeasurementRepository repository;

    public IssJobs(OpenNotifyClient client, IssMeasurementRepository repository) {
        this.client = client;
        this.repository = repository;
    }

    @Scheduled(fixedDelayString = "${iss.poll-interval-ms}")
    public void collect() {
        try {
            var position = client.fetchPosition();

            if (!repository.existsByMeasuredAt(position.measuredAt())) {
                var measurement = new IssMeasurement(
                        position.latitude(),
                        position.longitude(),
                        position.measuredAt()
                );

                repository.save(measurement);
            }
        } catch (Exception exception) {
            log.warn("Could not collect ISS position: {}", exception.getMessage());
        }
    }

    @Scheduled(cron = "${iss.cleanup-cron}", zone = "${iss.cleanup-zone}")
    public void clearHistory() {
        repository.deleteAllInBatch();

        log.info("ISS measurement history cleared by daily job");
    }
}
