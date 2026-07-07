package com.learnhub.controller;

import com.learnhub.dto.AiCredentialDTO;
import com.learnhub.dto.ApiResponse;
import com.learnhub.entity.User;
import com.learnhub.repository.UserRepository;
import com.learnhub.service.AiCredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-credentials")
@RequiredArgsConstructor
public class AiSettingsController {

    private final AiCredentialService credentialService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<AiCredentialDTO>> saveKey(@RequestBody Map<String, String> body, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String provider = body.get("provider");
        String rawKey = body.get("rawKey");
        
        AiCredentialDTO dto = credentialService.saveKey(user.getId(), provider, rawKey);
        return ResponseEntity.ok(ApiResponse.success(dto, "API Key encrypted and saved securely."));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AiCredentialDTO>>> getKeys(Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<AiCredentialDTO> keys = credentialService.getMyKeys(user.getId());
        return ResponseEntity.ok(ApiResponse.success(keys, "Fetched active AI credentials."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteKey(@PathVariable Long id, Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        credentialService.deleteKey(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "API Key permanently deleted."));
    }
}
