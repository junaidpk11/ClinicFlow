package ca.clinicflow.clinic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FormDefinitionRepository extends JpaRepository<FormDefinition, UUID> {
}
