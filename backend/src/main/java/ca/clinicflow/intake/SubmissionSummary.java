package ca.clinicflow.intake;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public class SubmissionSummary {
    public UUID id;
    public String patientName;
    public String patientEmail;
    public String patientPhone;
    public OffsetDateTime submittedAt;
    public Map<String, Object> responses;

    public SubmissionSummary(IntakeSubmission submission) {
        this.id = submission.getId();
        this.patientName = submission.getPatientFirstName() + " " + submission.getPatientLastName();
        this.patientEmail = submission.getPatientEmail();
        this.patientPhone = submission.getPatientPhone();
        this.submittedAt = submission.getSubmittedAt();
        this.responses = submission.getResponses();
    }
}
