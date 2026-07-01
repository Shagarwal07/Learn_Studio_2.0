package com.learnhub.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.learnhub.dto.*;
import com.learnhub.entity.RefreshToken;
import com.learnhub.entity.User;
import com.learnhub.repository.UserRepository;
import com.learnhub.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.client.id}")
    private String googleClientId;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .build();
        User savedUser = userRepository.save(user);
        
        String token = jwtUtil.generateToken(savedUser.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getId());
        
        return new AuthResponse(token, refreshToken.getToken(), savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        String token = jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        return new AuthResponse(token, refreshToken.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole().name());
    }

    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        try {
            GoogleIdToken.Payload payload = verifyGoogleToken(credential);
            String email = payload.getEmail();

            // LOGIN ONLY — user must already exist in DB
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("NOT_REGISTERED"));
            if (!user.isActive()) {
                throw new RuntimeException("Account is deactivated");
            }

            String token = jwtUtil.generateToken(user.getEmail());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
            
            return new AuthResponse(token, refreshToken.getToken(), user.getId(), user.getName(), user.getEmail(), user.getRole().name());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google login failed: " + e.getMessage());
        }
    }

    @Transactional
    public AuthResponse registerWithGoogle(String credential, String role) {
        try {
            GoogleIdToken.Payload payload = verifyGoogleToken(credential);
            String email = payload.getEmail();
            String name  = (String) payload.get("name");

            if (userRepository.existsByEmail(email))
                throw new RuntimeException("Email already registered. Please sign in instead.");

            User.Role userRole = (role != null && role.equalsIgnoreCase("INSTRUCTOR"))
                    ? User.Role.INSTRUCTOR : User.Role.STUDENT;

            User user = User.builder()
                    .name(name != null ? name : email)
                    .email(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role(userRole)
                    .build();
            User savedUser = userRepository.save(user);

            String token = jwtUtil.generateToken(savedUser.getEmail());
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getId());
            
            return new AuthResponse(token, refreshToken.getToken(), savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getRole().name());
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google registration failed: " + e.getMessage());
        }
    }

    private GoogleIdToken.Payload verifyGoogleToken(String credential) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();
        GoogleIdToken idToken = verifier.verify(credential);
        if (idToken == null) throw new RuntimeException("Invalid Google token");
        return idToken.getPayload();
    }
}
