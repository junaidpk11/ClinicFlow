package ca.clinicflow.intake;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Full submission returned to the dashboard detail view.
 * Includes the form schema so the UI can render field labels
 * alongside the patient's answers — no hardcoding needed.
 */
public class SubmissionDetail {

    public UUID id;
    public String patientFirstName;
    public String patientLastName;
    public String patientEmail;
    public String patientPhone;
    public OffsetDateTime submittedAt;

    /** The schema pages/fields from form_definition */
    public List<PageDef> formPages;

    /** Raw answers keyed by field name */
    public Map<String, Object> responses;

    /** Form meta */
    public String formName;
    public String clinicName;
    public String clinicType;

    public SubmissionDetail(IntakeSubmission s) {
        this.id                = s.getId();
        this.patientFirstName  = s.getPatientFirstName();
        this.patientLastName   = s.getPatientLastName();
        this.patientEmail      = s.getPatientEmail();
        this.patientPhone      = s.getPatientPhone();
        this.submittedAt       = s.getSubmittedAt();
        this.responses         = s.getResponses();
        this.clinicName        = s.getClinic().getName();

        var fd = s.getIntakeToken().getFormDefinition();
        this.formName   = fd.getName();
        this.clinicType = fd.getClinicType();

        // Parse pages from the schema map
        @SuppressWarnings("unchecked")
        var pages = (List<Map<String, Object>>) fd.getSchema().get("pages");
        if (pages != null) {
            this.formPages = pages.stream().map(p -> {
                @SuppressWarnings("unchecked")
                var fields = (List<Map<String, Object>>) p.get("fields");
                return new PageDef(
                    (String) p.get("id"),
                    (String) p.get("title"),
                    fields == null ? List.of() : fields.stream().map(f -> new FieldDef(
                        (String) f.get("name"),
                        (String) f.get("label"),
                        (String) f.get("type")
                    )).toList()
                );
            }).toList();
        }
    }

    public record PageDef(String id, String title, List<FieldDef> fields) {}
    public record FieldDef(String name, String label, String type) {}
}
