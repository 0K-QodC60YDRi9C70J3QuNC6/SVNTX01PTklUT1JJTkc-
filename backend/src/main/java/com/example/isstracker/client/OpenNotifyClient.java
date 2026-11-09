package com.example.isstracker.client;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OpenNotifyClient {

    private final RestClient client;
    private final String apiUrl;

    public OpenNotifyClient(RestClient client, @Value("${iss.api-url}") String apiUrl) {
        this.client = client;
        this.apiUrl = apiUrl;
    }

    public Position fetchPosition() {
        ApiResponse response = client.get()
                .uri(apiUrl)
                .retrieve()
                .body(ApiResponse.class);

        if (response == null
                || !"success".equals(response.message())
                || response.timestamp() == null
                || response.timestamp() <= 0
                || response.position() == null
                || response.position().latitude() == null
                || response.position().longitude() == null) {
            throw new IllegalStateException("Open Notify returned an invalid response");
        }

        double latitude = Double.parseDouble(response.position().latitude());
        double longitude = Double.parseDouble(response.position().longitude());

        if (!Double.isFinite(latitude)
                || latitude < -90
                || latitude > 90
                || !Double.isFinite(longitude)
                || longitude < -180
                || longitude > 180) {
            throw new IllegalStateException("Open Notify returned invalid coordinates");
        }

        Instant measuredAt = Instant.ofEpochSecond(response.timestamp());

        return new Position(latitude, longitude, measuredAt);
    }

    public record Position(
            double latitude,
            double longitude,
            Instant measuredAt
    ) {
    }

    private record ApiResponse(
            String message,
            Long timestamp,
            @JsonProperty("iss_position") ApiPosition position
    ) {
    }

    private record ApiPosition(
            String latitude,
            String longitude
    ) {
    }
}
