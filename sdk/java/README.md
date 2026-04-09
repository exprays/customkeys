# Nano Java SDK

Official Java SDK for the Nano secrets & config manager.

## Requirements

- Java 17+
- Maven or Gradle

## Installation

### Maven
```xml
<dependency>
    <groupId>dev.nano</groupId>
    <artifactId>nano-sdk</artifactId>
    <version>3.0.0</version>
</dependency>
```

### Gradle
```groovy
implementation 'dev.nano:nano-sdk:3.0.0'
```

## Usage

```java
import dev.nano.sdk.NanoClient;

NanoClient client = NanoClient.builder()
    .token(System.getenv("NANO_TOKEN"))
    .env(System.getenv("NANO_ENV_ID"))
    .build();

String dbPass = client.get("DATABASE_PASSWORD");
String apiKey = client.getOrDefault("THIRD_PARTY_KEY", "fallback");
Map<String, String> all = client.getAll();

// Always close when done (stops background threads)
client.close();
```

## Spring Boot Integration

```java
@Configuration
public class NanoConfig {
    @Bean
    public NanoClient nanoClient(
        @Value("${nano.token}") String token,
        @Value("${nano.env}") String env
    ) {
        return NanoClient.builder().token(token).env(env).build();
    }
}

@Service
public class DatabaseService {
    private final NanoClient nano;
    
    public DataSource buildDataSource() {
        return DataSourceBuilder.create()
            .url(nano.get("DATABASE_URL"))
            .username(nano.get("DATABASE_USER"))
            .password(nano.get("DATABASE_PASSWORD"))
            .build();
    }
}
```