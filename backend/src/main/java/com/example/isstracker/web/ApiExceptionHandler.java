package com.example.isstracker.web;

import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail handleStatus(ResponseStatusException exception) {
        return ProblemDetail.forStatusAndDetail(
                exception.getStatusCode(),
                exception.getReason()
        );
    }

    @ExceptionHandler({
            ConstraintViolationException.class,
            MethodArgumentTypeMismatchException.class,
            HandlerMethodValidationException.class
    })
    ProblemDetail handleParameters(Exception exception) {
        String detail = "Некорректные параметры: limit — 1–1000, size — 1–100, "
                + "идентификаторы — неотрицательные числа.";

        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }
}
