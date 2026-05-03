package ca.clinicflow.clinic;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter @Setter
@Entity
@Table(name = "clinic")
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    /** URL-safe identifier: clinicflow.ca/{slug}/intake */
    @Column(unique = true)
    private String slug;

    /**
     * Drives form-builder defaults and dashboard labels.
     * Values: chiro | physio | massage | dental | naturopath | general
     */
    @Column(name = "clinic_type", nullable = false)
    private String clinicType = "general";

    private String email;
    private String phone;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
