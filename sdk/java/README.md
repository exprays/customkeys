# CustomKeys Java SDK

Official Java SDK for the CustomKeys secrets & config manager.

## Requirements

- Java 17+
- Maven or Gradle

## Installation

### Maven
```xml
<dependency>
    <groupId>dev.customkeys</groupId>
    <artifactId>customkeys-sdk</artifactId>
    <version>3.0.0</version>
</dependency>
```

### Gradle
```groovy
implementation 'dev.customkeys:customkeys-sdk:3.0.0'
```

## Usage

```java
import dev.customkeys.sdk.CustomKeysClient;

CustomKeysClient client = CustomKeysClient.builder()
    .token(System.getenv("CUSTOMKEYS_TOKEN"))
    .env(System.getenv("CUSTOMKEYS_ENV_ID"))
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
public class CustomKeysConfig {
    @Bean
    public CustomKeysClient customKeysClient(
        @Value("${customkeys.token}") String token,
        @Value("${customkeys.env}") String env
    ) {
        return CustomKeysClient.builder().token(token).env(env).build();
    }
}

@Service
public class DatabaseService {
    private final CustomKeysClient customKeys;
    
    public DataSource buildDataSource() {
        return DataSourceBuilder.create()
            .url(customKeys.get("DATABASE_URL"))
            .username(customKeys.get("DATABASE_USER"))
            .password(customKeys.get("DATABASE_PASSWORD"))
            .build();
    }
}
```