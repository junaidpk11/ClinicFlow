package ca.clinicflow.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "clinicflow.jwt")
public class JwtProperties {
    private String secret;
    private int expiryHours = 24;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public int getExpiryHours() { return expiryHours; }
    public void setExpiryHours(int expiryHours) { this.expiryHours = expiryHours; }
}
