package com.learnhub.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.learnhub.dto.*;
import com.learnhub.entity.RefreshToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.learnhub.entity.User;
import com.learnhub.repository.UserRepository;
import com.learnhub.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.Optional;

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

    @Value("${google.auth.strict-verification:true}")
    private boolean strictGoogleAuth;

    @Value("${google.self-link.enabled:false}")
    private boolean selfLinkEnabled;

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

    private final com.learnhub.repository.UserIdentityProfileRepository userIdentityProfileRepository;

    @Transactional
    public AuthResponse loginWithGoogle(String credential) {
        try {
            GoogleIdToken.Payload payload = verifyGoogleToken(credential);
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified != null && !emailVerified) {
                throw new RuntimeException("Google email is not verified");
            }

            String googleEmail = payload.getEmail();
            String googleSub = payload.getSubject();
            String googleName = (String) payload.get("name");
            String googlePictureUrl = (String) payload.get("picture");

            User user;

            // 4. Lookup UserIdentityProfile
            Optional<com.learnhub.entity.UserIdentityProfile> existingProfileOpt = userIdentityProfileRepository.findByGoogleSub(googleSub).stream().findFirst();
            
            if (existingProfileOpt.isEmpty()) {
                existingProfileOpt = userIdentityProfileRepository.findByGoogleEmail(googleEmail).stream().findFirst();
            }
            
            if (existingProfileOpt.isPresent()) {
                com.learnhub.entity.UserIdentityProfile existingProfile = existingProfileOpt.get();
                // 5. If googleSub is NULL: store googleSub, update name, update picture
                // 6. Never overwrite an existing googleSub.
                if (existingProfile.getGoogleSub() == null || existingProfile.getGoogleSub().isEmpty()) {
                    existingProfile.setGoogleSub(googleSub);
                    existingProfile.setGoogleName(googleName);
                    existingProfile.setGooglePictureUrl(googlePictureUrl);
                    userIdentityProfileRepository.save(existingProfile);
                }
                user = existingProfile.getUser();
            } else {
                throw new RuntimeException("This Google account is not linked to your LearnStudio account. Please contact your administrator.");
            }

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
        // Redirect to unified login logic
        return loginWithGoogle(credential);
    }

    @Transactional
    public void linkGoogleAccount(String credential, String userEmail) {
        if (!selfLinkEnabled) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Self-linking Google accounts is temporarily disabled. Contact Administrator.");
        }
        try {
            GoogleIdToken.Payload payload = verifyGoogleToken(credential);
            String googleEmail = payload.getEmail();
            String googleSub = payload.getSubject();
            String googleName = (String) payload.get("name");
            String googlePictureUrl = (String) payload.get("picture");

            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Logged in user not found"));

            // Check if this Google email is already linked to another account
            var existingProfile = userIdentityProfileRepository.findByGoogleEmail(googleEmail).stream().findFirst();
            if (existingProfile.isPresent()) {
                // Duplicates allowed: removed validation.    // Update existing profile
                com.learnhub.entity.UserIdentityProfile profile = existingProfile.get();
                profile.setGoogleSub(googleSub);
                profile.setGoogleName(googleName);
                profile.setGooglePictureUrl(googlePictureUrl);
                userIdentityProfileRepository.save(profile);
            } else {
                // Remove any old profile for this user
                userIdentityProfileRepository.deleteByUser(user);
                
                // Create the profile linking the Google info securely
                com.learnhub.entity.UserIdentityProfile newProfile = com.learnhub.entity.UserIdentityProfile.builder()
                        .user(user)
                        .googleEmail(googleEmail)
                        .googleSub(googleSub)
                        .googleName(googleName)
                        .googlePictureUrl(googlePictureUrl)
                        .build();
                userIdentityProfileRepository.save(newProfile);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Google link failed: " + e.getMessage());
        }
    }

    private GoogleIdToken.Payload verifyGoogleToken(String credential) throws Exception {
        if (strictGoogleAuth) {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), com.google.api.client.json.gson.GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) throw new RuntimeException("Invalid Google token (Strict Verification Failed)");
            return idToken.getPayload();
        } else {
            // Bypass strict verification for local development due to system clock skew (e.g. 2026 vs real time).
            GoogleIdToken idToken = GoogleIdToken.parse(com.google.api.client.json.gson.GsonFactory.getDefaultInstance(), credential);
            if (idToken == null) throw new RuntimeException("Invalid Google token format");
            return idToken.getPayload();
        }
    }
}
