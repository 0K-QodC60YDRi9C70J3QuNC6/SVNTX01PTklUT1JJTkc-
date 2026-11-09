FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn -B -Dmaven.test.skip=true package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /build/target/iss-tracker.jar app.jar
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
