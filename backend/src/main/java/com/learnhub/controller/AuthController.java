package com.learnhub.controller;

import com.learnhub.dto.*;
import com.learnhub.entity.RefreshToken;
import com.learnhub.service.AuthService;
import com.learnhub.service.RefreshTokenService;
import com.learnhub.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
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
        return ResponseEntity.badRequest().body(ApiResponse.error("Registration is currently locked by the administrator."));
    }

    private ResponseCookie createCookie(String name, String value, int maxAgeDays) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false) // Set to true if using HTTPS in production
                .path("/")
                .maxAge(value == null || value.isEmpty() ? 0 : maxAgeDays * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        
        ResponseCookie accessCookie = createCookie("access_token", response.getToken(), 1);
        ResponseCookie refreshCookie = createCookie("refresh_token", response.getRefreshToken(), 7);
        
        // Clear tokens from JSON payload for security
        response.setToken(null);
        response.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, String> body) {
        AuthResponse response = authService.loginWithGoogle(body.get("credential"));
        
        ResponseCookie accessCookie = createCookie("access_token", response.getToken(), 1);
        ResponseCookie refreshCookie = createCookie("refresh_token", response.getRefreshToken(), 7);
        
        // Clear tokens from JSON payload for security
        response.setToken(null);
        response.setRefreshToken(null);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success(response, "Google login successful"));
    }

    @PostMapping("/google/register")
    public ResponseEntity<ApiResponse<AuthResponse>> googleRegister(@RequestBody Map<String, String> body) {
        return ResponseEntity.badRequest().body(ApiResponse.error("Registration is currently locked by the administrator."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(
            @CookieValue(value = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) TokenRefreshRequest request) {
        
        String requestRefreshToken = cookieRefreshToken != null ? cookieRefreshToken : (request != null ? request.getRefreshToken() : null);
        if (requestRefreshToken == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Refresh token is missing"));
        }
        
        RefreshToken token = refreshTokenService.findByToken(requestRefreshToken);
        refreshTokenService.verifyExpiration(token);
        
        String accessToken = jwtUtil.generateToken(token.getUser().getEmail());
        TokenRefreshResponse response = new TokenRefreshResponse(null, null); // Return null in payload
        
        ResponseCookie accessCookie = createCookie("access_token", accessToken, 1);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .body(ApiResponse.success(response, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(
            @CookieValue(value = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) Map<String, String> body) {
            
        String refreshToken = cookieRefreshToken != null ? cookieRefreshToken : (body != null ? body.get("refreshToken") : null);
        
        if (refreshToken != null) {
            try {
                RefreshToken token = refreshTokenService.findByToken(refreshToken);
                refreshTokenService.deleteByUserId(token.getUser().getId());
            } catch (Exception e) {
                // Ignore if token already not found
            }
        }
        
        ResponseCookie clearAccess = createCookie("access_token", "", 0);
        ResponseCookie clearRefresh = createCookie("refresh_token", "", 0);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccess.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefresh.toString())
                .body(ApiResponse.success(null, "Logged out successfully"));
    }
}
