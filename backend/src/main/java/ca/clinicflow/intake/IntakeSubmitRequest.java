package ca.clinicflow.intake;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public class IntakeSubmitRequest {
    @NotBlank
    public String firstName;

    @NotBlank
    public String lastName;

    public String email;
    public String phone;

    public Map<String, Object> responses;
}
