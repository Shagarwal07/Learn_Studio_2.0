package com.learnhub.repository;

import com.learnhub.entity.UserAiPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAiPlanRepository extends JpaRepository<UserAiPlan, Long> {
    Optional<UserAiPlan> findByUserId(Long userId);
}
