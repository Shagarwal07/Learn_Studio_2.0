package com.learnhub.repository;

import com.learnhub.entity.UserAiCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAiCredentialRepository extends JpaRepository<UserAiCredential, Long> {
    List<UserAiCredential> findByUserId(Long userId);
    List<UserAiCredential> findByUserIdAndActiveTrue(Long userId);
    Optional<UserAiCredential> findByUserIdAndProviderAndActiveTrue(Long userId, String provider);
    Optional<UserAiCredential> findByUserIdAndKeyHash(Long userId, String keyHash);
}
