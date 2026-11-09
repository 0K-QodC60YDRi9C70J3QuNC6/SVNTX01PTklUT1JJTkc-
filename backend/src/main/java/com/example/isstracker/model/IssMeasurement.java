package com.example.isstracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "iss_measurement")
public class IssMeasurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "measured_at", nullable = false, unique = true)
    private Instant measuredAt;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    protected IssMeasurement() {
    }

    public IssMeasurement(double latitude, double longitude, Instant measuredAt) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.measuredAt = measuredAt;
    }

    public Long getId() {
        return id;
    }

    public Instant getMeasuredAt() {
        return measuredAt;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }
}
