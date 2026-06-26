package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.entity.RefreshToken;
import com.learnhub.service.AuthService;
import com.learnhub.service.RefreshTokenService;
import com.learnhub.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, String> body) {
        AuthResponse response = authService.loginWithGoogle(body.get("credential"));
        return ResponseEntity.ok(ApiResponse.success(response, "Google login successful"));
    }

    @PostMapping("/google/register")
    public ResponseEntity<ApiResponse<AuthResponse>> googleRegister(@RequestBody Map<String, String> body) {
        AuthResponse response = authService.registerWithGoogle(body.get("credential"), body.get("role"));
        return ResponseEntity.ok(ApiResponse.success(response, "Google registration successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken token = refreshTokenService.findByToken(requestRefreshToken);
        refreshTokenService.verifyExpiration(token);
        
        String accessToken = jwtUtil.generateToken(token.getUser().getEmail());
        TokenRefreshResponse response = new TokenRefreshResponse(accessToken, token.getToken());
        
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken != null) {
            try {
                RefreshToken token = refreshTokenService.findByToken(refreshToken);
                refreshTokenService.deleteByUserId(token.getUser().getId());
            } catch (Exception e) {
                // Ignore if token already not found
            }
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}
