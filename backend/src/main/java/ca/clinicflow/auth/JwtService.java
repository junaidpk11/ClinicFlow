package ca.clinicflow.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String issue(UUID clinicId, String email) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claim("clinicId", clinicId.toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(props.getExpiryHours(), ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }

    /** Returns claims or throws JwtException if invalid / expired. */
    public Claims verify(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractClinicId(Claims claims) {
        return UUID.fromString(claims.get("clinicId", String.class));
    }
}
