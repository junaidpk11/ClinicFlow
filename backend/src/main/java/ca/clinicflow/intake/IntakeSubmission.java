package ca.clinicflow.intake;

import ca.clinicflow.clinic.Clinic;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "intake_submission")
public class IntakeSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinic_id", nullable = false)
    private Clinic clinic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "token", nullable = false)
    private IntakeToken intakeToken;

    @Column(name = "patient_first_name", nullable = false)
    private String patientFirstName;

    @Column(name = "patient_last_name", nullable = false)
    private String patientLastName;

    @Column(name = "patient_email")
    private String patientEmail;

    @Column(name = "patient_phone")
    private String patientPhone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> responses;

    @Column(name = "submitted_from_ip", columnDefinition = "inet")
    private String submittedFromIp;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "submitted_at", nullable = false)
    private OffsetDateTime submittedAt;

    @PrePersist
    void prePersist() {
        if (submittedAt == null) submittedAt = OffsetDateTime.now();
    }
}

