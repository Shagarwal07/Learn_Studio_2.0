package com.learnhub.controller;

import com.learnhub.dto.ApiResponse;
import com.learnhub.entity.User;
import com.learnhub.entity.UserAiPlan;
import com.learnhub.repository.AiUsageLogRepository;
import com.learnhub.repository.UserAiPlanRepository;
import com.learnhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/ai")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAiController {

    private final UserAiPlanRepository planRepository;
    private final AiUsageLogRepository usageLogRepository;
    private final UserRepository userRepository;

    @PutMapping("/users/{userId}/plan")
    public ResponseEntity<ApiResponse<UserAiPlan>> updateUserPlan(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        UserAiPlan plan = planRepository.findByUserId(userId).orElseGet(() -> {
            UserAiPlan newPlan = UserAiPlan.builder().user(user).build();
            return planRepository.save(newPlan);
        });
        
        if (body.containsKey("planType")) plan.setPlanType(body.get("planType").toUpperCase());
        if (body.containsKey("planStatus")) plan.setPlanStatus(body.get("planStatus").toUpperCase());
        if (body.containsKey("aiMonthlyLimit")) plan.setAiMonthlyLimit(Integer.parseInt(body.get("aiMonthlyLimit")));
        if (body.containsKey("billingOwner")) plan.setBillingOwner(body.get("billingOwner"));
        
        planRepository.save(plan);
        return ResponseEntity.ok(ApiResponse.success(plan, "User plan updated successfully"));
    }

    @PostMapping("/users/{userId}/plan/reset")
    public ResponseEntity<ApiResponse<Void>> resetUserQuota(@PathVariable Long userId) {
        UserAiPlan plan = planRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User plan not found"));
        plan.setAiMonthlyUsed(0);
        planRepository.save(plan);
        return ResponseEntity.ok(ApiResponse.success(null, "User quota reset successfully"));
    }

    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<List<?>>> getGlobalUsage() {
        return ResponseEntity.ok(ApiResponse.success(usageLogRepository.findAll(), "Global usage retrieved"));
    }
}
