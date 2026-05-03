package ca.clinicflow.intake;

import ca.clinicflow.audit.AuditService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class IntakeService {

    private final IntakeTokenRepository tokenRepository;
    private final IntakeSubmissionRepository submissionRepository;
    private final AuditService auditService;

    public IntakeService(IntakeTokenRepository tokenRepository,
                         IntakeSubmissionRepository submissionRepository,
                         AuditService auditService) {
        this.tokenRepository = tokenRepository;
        this.submissionRepository = submissionRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public IntakeStartResponse start(String tokenValue) {
        IntakeToken token = findValidToken(tokenValue);
        return new IntakeStartResponse(
                token.getToken(),
                token.getClinic().getName(),
                token.getFormDefinition().getName(),
                token.getFormDefinition().getSchema()
        );
    }

    @Transactional
    public IntakeSubmitResponse submit(String tokenValue, IntakeSubmitRequest request,
                                       String ipAddress, String userAgent) {
        IntakeToken token = findValidToken(tokenValue);

        IntakeSubmission submission = new IntakeSubmission();
        submission.setClinic(token.getClinic());
        submission.setIntakeToken(token);
        submission.setPatientFirstName(request.firstName.trim());
        submission.setPatientLastName(request.lastName.trim());
        submission.setPatientEmail(firstNonBlank(request.email, valueFromResponses(request.responses, "email")));
        submission.setPatientPhone(firstNonBlank(request.phone, valueFromResponses(request.responses, "phone")));
        submission.setResponses(request.responses == null ? java.util.Map.of() : request.responses);
        submission.setSubmittedFromIp(ipAddress);
        submission.setUserAgent(userAgent);

        IntakeSubmission saved = submissionRepository.save(submission);

        // PIPEDA audit
        auditService.logPublic("SUBMISSION_CREATED", "intake_submission",
                saved.getId().toString(), ipAddress, userAgent);

        return new IntakeSubmitResponse(saved.getId());
    }

    @Transactional(readOnly = true)
    public List<SubmissionSummary> latestSubmissions(UUID clinicId) {
        return submissionRepository.findTop50ByClinic_IdOrderBySubmittedAtDesc(clinicId)
                .stream()
                .map(SubmissionSummary::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionSummary> search(UUID clinicId, String query) {
        return submissionRepository.searchByName(clinicId, query)
                .stream()
                .map(SubmissionSummary::new)
                .toList();
    }

    /**
     * Returns full submission with schema — for the detail page.
     * Enforces clinic ownership before returning.
     */
    @Transactional(readOnly = true)
    public SubmissionDetail getDetail(UUID submissionId, UUID clinicId,
                                      UUID userId, String userEmail,
                                      String ipAddress, String userAgent) {
        IntakeSubmission submission = submissionRepository
                .findByIdAndClinic_Id(submissionId, clinicId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found"));

        // PIPEDA: record every time a staff member views a patient record
        auditService.log(clinicId, userId, userEmail,
                "SUBMISSION_VIEWED", "intake_submission", submissionId.toString(),
                ipAddress, userAgent, null);

        return new SubmissionDetail(submission);
    }

    public long countSubmissions(UUID clinicId) {
        return submissionRepository.countByClinic_Id(clinicId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IntakeToken findValidToken(String tokenValue) {
        IntakeToken token = tokenRepository.findById(tokenValue)
                .orElseThrow(() -> new EntityNotFoundException("Invalid intake link"));
        if (!token.isActive())
            throw new IllegalStateException("This intake link is no longer active");
        if (token.isExpired())
            throw new IllegalStateException("This intake link has expired");
        return token;
    }

    private static String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    private static String firstNonBlank(String a, String b) {
        String ca = blankToNull(a);
        return ca != null ? ca : blankToNull(b);
    }

    private static String valueFromResponses(java.util.Map<String, Object> r, String key) {
        if (r == null || !r.containsKey(key) || r.get(key) == null) return null;
        return String.valueOf(r.get(key));
    }
}
