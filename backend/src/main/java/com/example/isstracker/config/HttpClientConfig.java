package com.example.isstracker.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class HttpClientConfig {

    @Bean
    RestClient openNotifyRestClient(RestClient.Builder builder) {
        var factory = new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));

        return builder
                .requestFactory(factory)
                .defaultHeader("User-Agent", "ISS-Tracker/1.0")
                .build();
    }
}
