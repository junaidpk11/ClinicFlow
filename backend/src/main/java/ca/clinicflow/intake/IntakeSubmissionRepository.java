package ca.clinicflow.intake;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IntakeSubmissionRepository extends JpaRepository<IntakeSubmission, UUID> {

    /** Clinic-scoped query — ensures a user only sees their own patients. */
    List<IntakeSubmission> findTop50ByClinic_IdOrderBySubmittedAtDesc(UUID clinicId);
}
