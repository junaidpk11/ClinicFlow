package ca.clinicflow.intake;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IntakeSubmissionRepository extends JpaRepository<IntakeSubmission, UUID> {

    /** Dashboard list — clinic-scoped. */
    List<IntakeSubmission> findTop50ByClinic_IdOrderBySubmittedAtDesc(UUID clinicId);

    /** Clinic-scoped fetch by ID — prevents cross-clinic access. */
    Optional<IntakeSubmission> findByIdAndClinic_Id(UUID id, UUID clinicId);

    /** Full-text patient name search scoped to clinic. */
    @Query("""
        SELECT s FROM IntakeSubmission s
        WHERE s.clinic.id = :clinicId
          AND (LOWER(s.patientFirstName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(s.patientLastName)  LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY s.submittedAt DESC
        LIMIT 50
        """)
    List<IntakeSubmission> searchByName(@Param("clinicId") UUID clinicId, @Param("q") String query);

    /** Total count for stats bar. */
    long countByClinic_Id(UUID clinicId);
}
