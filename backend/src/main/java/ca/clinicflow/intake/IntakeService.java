package ca.clinicflow.intake;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class IntakeService {

    private final IntakeTokenRepository tokenRepository;
    private final IntakeSubmissionRepository submissionRepository;

    public IntakeService(IntakeTokenRepository tokenRepository,
                         IntakeSubmissionRepository submissionRepository) {
        this.tokenRepository = tokenRepository;
        this.submissionRepository = submissionRepository;
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
    public IntakeSubmitResponse submit(String tokenValue, IntakeSubmitRequest request) {
        IntakeToken token = findValidToken(tokenValue);

        IntakeSubmission submission = new IntakeSubmission();
        submission.setClinic(token.getClinic());
        submission.setIntakeToken(token);
        submission.setPatientFirstName(request.firstName.trim());
        submission.setPatientLastName(request.lastName.trim());
        submission.setPatientEmail(firstNonBlank(request.email, valueFromResponses(request.responses, "email")));
        submission.setPatientPhone(firstNonBlank(request.phone, valueFromResponses(request.responses, "phone")));
        submission.setResponses(request.responses == null ? java.util.Map.of() : request.responses);

        IntakeSubmission saved = submissionRepository.save(submission);
        return new IntakeSubmitResponse(saved.getId());
    }

    /**
     * Returns only submissions belonging to the requesting clinic.
     * clinicId comes from the verified JWT — not from the request body.
     */
    @Transactional(readOnly = true)
    public List<SubmissionSummary> latestSubmissions(UUID clinicId) {
        return submissionRepository.findTop50ByClinic_IdOrderBySubmittedAtDesc(clinicId)
                .stream()
                .map(SubmissionSummary::new)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private IntakeToken findValidToken(String tokenValue) {
        IntakeToken token = tokenRepository.findById(tokenValue)
                .orElseThrow(() -> new EntityNotFoundException("Invalid intake token"));
        if (!token.isActive()) {
            throw new IllegalStateException("This intake link is no longer active");
        }
        if (token.isExpired()) {
            throw new IllegalStateException("This intake link has expired");
        }
        return token;
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    private static String firstNonBlank(String first, String second) {
        String cleanedFirst = blankToNull(first);
        return cleanedFirst != null ? cleanedFirst : blankToNull(second);
    }

    private static String valueFromResponses(java.util.Map<String, Object> responses, String key) {
        if (responses == null || !responses.containsKey(key) || responses.get(key) == null) {
            return null;
        }
        return String.valueOf(responses.get(key));
    }
}
