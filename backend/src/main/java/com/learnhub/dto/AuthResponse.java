package com.learnhub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String name;
    private String email;
    private String role;
}
