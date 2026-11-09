package com.example.isstracker.web;

import com.example.isstracker.service.IssService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/iss")
public class IssController {

    private final IssService service;

    public IssController(IssService service) {
        this.service = service;
    }

    @GetMapping("/current")
    public IssService.Measurement current() {
        return service.current();
    }

    @GetMapping("/history")
    public IssService.HistoryPage history(
            @RequestParam(defaultValue = "1000")
            @Min(1)
            @Max(1000)
            int limit,

            @RequestParam(defaultValue = "100")
            @Min(1)
            @Max(100)
            int size,

            @RequestParam(required = false)
            @Min(0)
            Long untilId,

            @RequestParam(defaultValue = "0")
            @Min(0)
            long afterId
    ) {
        return service.history(limit, size, untilId, afterId);
    }
}
