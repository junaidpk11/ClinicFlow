package ca.clinicflow.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * PIPEDA compliance — immutable record of every significant action.
 * Never delete rows. Retain minimum 7 years.
 */
@Getter
@Setter
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "clinic_id")
    private UUID clinicId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_email")
    private String userEmail;

    /** e.g. SUBMISSION_VIEWED, SUBMISSION_EXPORTED, TOKEN_CREATED, LOGIN */
    @Column(nullable = false)
    private String action;

    @Column(name = "entity_type")
    private String entityType;   // "intake_submission", "intake_token", ...

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "ip_address", columnDefinition = "inet")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> meta;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = OffsetDateTime.now();
    }
}
