package com.learnhub.service;

import com.learnhub.dto.AiCredentialDTO;
import com.learnhub.entity.User;
import com.learnhub.entity.UserAiCredential;
import com.learnhub.repository.UserAiCredentialRepository;
import com.learnhub.repository.UserRepository;
import com.learnhub.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiCredentialService {

    private final UserAiCredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final EncryptionUtil encryptionUtil;

    @Transactional
    public AiCredentialDTO saveKey(Long userId, String provider, String rawKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (rawKey == null || rawKey.trim().length() < 10) {
            throw new RuntimeException("Invalid API key provided.");
        }

        String keyHash = generateHash(rawKey);
        
        Optional<UserAiCredential> existingHash = credentialRepository.findByUserIdAndKeyHash(userId, keyHash);
        if (existingHash.isPresent()) {
            throw new RuntimeException("This API key has already been added.");
        }

        // Deactivate old key for this provider
        credentialRepository.findByUserIdAndProviderAndActiveTrue(userId, provider)
                .ifPresent(c -> {
                    c.setActive(false);
                    credentialRepository.save(c);
                });

        String maskedKey = maskKey(rawKey, provider);
        String encryptedKey = encryptionUtil.encrypt(rawKey);

        UserAiCredential credential = UserAiCredential.builder()
                .user(user)
                .provider(provider.toUpperCase())
                .encryptedApiKey(encryptedKey)
                .keyLast4(maskedKey)
                .keyHash(keyHash)
                .active(true)
                .build();

        UserAiCredential saved = credentialRepository.save(credential);
        
        return AiCredentialDTO.builder()
                .id(saved.getId())
                .provider(saved.getProvider())
                .maskedKey(saved.getKeyLast4())
                .active(saved.getActive())
                .createdAt(saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : "")
                .build();
    }

    public List<AiCredentialDTO> getMyKeys(Long userId) {
        return credentialRepository.findByUserId(userId).stream()
                .filter(UserAiCredential::getActive)
                .map(c -> AiCredentialDTO.builder()
                        .id(c.getId())
                        .provider(c.getProvider())
                        .maskedKey(c.getKeyLast4())
                        .active(c.getActive())
                        .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "")
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteKey(Long userId, Long keyId) {
        UserAiCredential credential = credentialRepository.findById(keyId)
                .orElseThrow(() -> new RuntimeException("Credential not found"));
        
        if (!credential.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Cannot delete another user's key");
        }
        
        credentialRepository.delete(credential);
    }

    public String getDecryptedKey(Long userId, String provider) {
        return credentialRepository.findByUserIdAndProviderAndActiveTrue(userId, provider.toUpperCase())
                .map(c -> encryptionUtil.decrypt(c.getEncryptedApiKey()))
                .orElse(null);
    }

    private String generateHash(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate key hash", e);
        }
    }

    private String maskKey(String rawKey, String provider) {
        String last4 = rawKey.substring(Math.max(0, rawKey.length() - 4));
        if (provider.equalsIgnoreCase("OPENROUTER")) {
            return "sk-or-v1-***" + last4;
        } else if (provider.equalsIgnoreCase("GEMINI")) {
            return "AIzaSy***" + last4;
        }
        return "***" + last4;
    }
}
