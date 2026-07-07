package com.learnhub.service;

import com.learnhub.entity.AiUsageLog;
import com.learnhub.entity.User;
import com.learnhub.entity.UserAiPlan;
import com.learnhub.repository.AiUsageLogRepository;
import com.learnhub.repository.UserAiPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class AiPlanService {

    private final UserAiPlanRepository planRepository;
    private final AiUsageLogRepository usageLogRepository;

    @Transactional
    public UserAiPlan getUserPlan(User user) {
        return planRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultFreePlan(user));
    }

    private UserAiPlan createDefaultFreePlan(User user) {
        UserAiPlan plan = UserAiPlan.builder()
                .user(user)
                .planType("FREE")
                .planStatus("ACTIVE")
                .aiMonthlyLimit(5000) // Default 5000 calls for FREE plan during development
                .aiMonthlyUsed(0)
                .build();
        return planRepository.save(plan);
    }

    @Transactional
    public void incrementUsage(User user, String feature, String provider, String model, int tokensUsed, BigDecimal estimatedCost, boolean success, String errorType) {
        UserAiPlan plan = getUserPlan(user);

        // Only increment quota usage if the provider is NOT BYOK (BYOK doesn't count against LearnStudio quota)
        // Also only increment if it was a successful generation that cost us money
        if (success && !plan.getPlanType().equals("BYOK")) {
            plan.setAiMonthlyUsed(plan.getAiMonthlyUsed() + 1);
            planRepository.save(plan);
        }

        AiUsageLog log = AiUsageLog.builder()
                .user(user)
                .planType(plan.getPlanType())
                .feature(feature)
                .provider(provider)
                .model(model)
                .tokensUsed(tokensUsed)
                .estimatedCost(estimatedCost)
                .latencyMs(0L) // Logged separately if needed
                .success(success)
                .errorType(errorType)
                .build();
        usageLogRepository.save(log);
    }

    public boolean hasAvailableQuota(User user) {
        UserAiPlan plan = getUserPlan(user);
        if ("ACTIVE".equals(plan.getPlanStatus())) {
            // BYOK and PREMIUM might have unlimited or higher limits, but we enforce the limit rule for FREE
            if ("FREE".equals(plan.getPlanType())) {
                return plan.getAiMonthlyUsed() < plan.getAiMonthlyLimit();
            }
            return true;
        }
        return false;
    }
}
