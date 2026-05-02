package ca.clinicflow.intake;

import java.util.UUID;

public class IntakeSubmitResponse {
    public UUID submissionId;

    public IntakeSubmitResponse(UUID submissionId) {
        this.submissionId = submissionId;
    }
}
