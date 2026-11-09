package com.example.isstracker.repository;

import com.example.isstracker.model.IssMeasurement;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IssMeasurementRepository extends JpaRepository<IssMeasurement, Long> {

    Optional<IssMeasurement> findFirstByOrderByIdDesc();

    boolean existsByMeasuredAt(Instant measuredAt);

    List<IssMeasurement> findByIdLessThanEqualOrderByIdDesc(Long id, Pageable pageable);
}
