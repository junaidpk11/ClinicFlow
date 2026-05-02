package ca.clinicflow.intake;

import ca.clinicflow.auth.ClinicPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class IntakeController {

    private final IntakeService intakeService;

    public IntakeController(IntakeService intakeService) {
        this.intakeService = intakeService;
    }

    /** Public — no auth needed. Returns form schema for dynamic rendering. */
    @GetMapping("/intake/{token}")
    public IntakeStartResponse start(@PathVariable String token) {
        return intakeService.start(token);
    }

    /** Public — no auth needed. Patient submits the completed form. */
    @PostMapping("/intake/{token}/submit")
    public IntakeSubmitResponse submit(@PathVariable String token,
                                       @Valid @RequestBody IntakeSubmitRequest request) {
        return intakeService.submit(token, request);
    }

    /**
     * Protected — requires valid JWT.
     * clinicId is extracted from the token, never from the request.
     */
    @GetMapping("/dashboard/submissions")
    public List<SubmissionSummary> latestSubmissions(@AuthenticationPrincipal ClinicPrincipal principal) {
        return intakeService.latestSubmissions(principal.clinicId());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handle(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
