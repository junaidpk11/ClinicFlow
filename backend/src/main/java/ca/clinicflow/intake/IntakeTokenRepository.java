package ca.clinicflow.intake;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IntakeTokenRepository extends JpaRepository<IntakeToken, String> {
}
