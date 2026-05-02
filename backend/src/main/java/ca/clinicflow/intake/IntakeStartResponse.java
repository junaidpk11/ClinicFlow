package ca.clinicflow.intake;

import java.util.Map;

public class IntakeStartResponse {
    public String token;
    public String clinicName;
    public String formName;
    public Map<String, Object> schema;

    public IntakeStartResponse(String token, String clinicName, String formName, Map<String, Object> schema) {
        this.token = token;
        this.clinicName = clinicName;
        this.formName = formName;
        this.schema = schema;
    }
}
