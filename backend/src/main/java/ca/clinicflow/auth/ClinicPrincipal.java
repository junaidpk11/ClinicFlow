package ca.clinicflow.auth;

import java.util.UUID;

/** Authenticated staff identity attached to the SecurityContext. */
public record ClinicPrincipal(UUID clinicId, UUID userId, String email) {}
