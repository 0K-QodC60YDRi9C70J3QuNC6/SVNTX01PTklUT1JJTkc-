package com.example.isstracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class IssTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(IssTrackerApplication.class, args);
    }
}
