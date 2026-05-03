package ca.clinicflow.audit;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    /**
     * Fire-and-forget — does not block the request thread.
     * Called from controllers after the main action succeeds.
     */
    @Async
    public void log(UUID clinicId, UUID userId, String userEmail,
                    String action, String entityType, String entityId,
                    String ipAddress, String userAgent, Map<String, Object> meta) {
        AuditLog entry = new AuditLog();
        entry.setClinicId(clinicId);
        entry.setUserId(userId);
        entry.setUserEmail(userEmail);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setIpAddress(ipAddress);
        entry.setUserAgent(userAgent);
        entry.setMeta(meta);
        repo.save(entry);
    }

    /** Convenience — log without user context (patient-facing actions) */
    @Async
    public void logPublic(String action, String entityType, String entityId,
                          String ipAddress, String userAgent) {
        log(null, null, null, action, entityType, entityId, ipAddress, userAgent, null);
    }
}
