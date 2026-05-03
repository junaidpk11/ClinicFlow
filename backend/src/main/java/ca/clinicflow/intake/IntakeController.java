package ca.clinicflow.intake;

import ca.clinicflow.auth.ClinicPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class IntakeController {

    private final IntakeService intakeService;

    public IntakeController(IntakeService intakeService) {
        this.intakeService = intakeService;
    }

    // ── Public (no auth) ──────────────────────────────────────────────────────

    /** Returns form schema for dynamic rendering */
    @GetMapping("/intake/{token}")
    public IntakeStartResponse start(@PathVariable String token) {
        return intakeService.start(token);
    }

    /** Patient submits completed form */
    @PostMapping("/intake/{token}/submit")
    public IntakeSubmitResponse submit(@PathVariable String token,
                                       @Valid @RequestBody IntakeSubmitRequest request,
                                       HttpServletRequest httpRequest) {
        String ip = resolveIp(httpRequest);
        String ua = httpRequest.getHeader("User-Agent");
        return intakeService.submit(token, request, ip, ua);
    }

    // ── Protected (JWT required) ──────────────────────────────────────────────

    /** Dashboard list — clinic-scoped automatically via JWT */
    @GetMapping("/dashboard/submissions")
    public List<SubmissionSummary> list(
            @AuthenticationPrincipal ClinicPrincipal principal,
            @RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return intakeService.search(principal.clinicId(), q.trim());
        }
        return intakeService.latestSubmissions(principal.clinicId());
    }

    /** Full detail view — records audit log entry per PIPEDA */
    @GetMapping("/dashboard/submissions/{id}")
    public SubmissionDetail detail(
            @PathVariable UUID id,
            @AuthenticationPrincipal ClinicPrincipal principal,
            HttpServletRequest httpRequest) {
        return intakeService.getDetail(
                id, principal.clinicId(),
                principal.userId(), principal.email(),
                resolveIp(httpRequest), httpRequest.getHeader("User-Agent"));
    }

    /** Summary stats for dashboard header */
    @GetMapping("/dashboard/stats")
    public Map<String, Object> stats(@AuthenticationPrincipal ClinicPrincipal principal) {
        return Map.of(
            "totalSubmissions", intakeService.countSubmissions(principal.clinicId()),
            "clinicId", principal.clinicId()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handle(Exception ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }

    private String resolveIp(HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : req.getRemoteAddr();
    }
}
