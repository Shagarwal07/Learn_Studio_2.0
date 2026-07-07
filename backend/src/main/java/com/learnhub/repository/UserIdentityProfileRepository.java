package com.learnhub.repository;

import com.learnhub.entity.UserIdentityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserIdentityProfileRepository extends JpaRepository<UserIdentityProfile, Long> {
    Optional<UserIdentityProfile> findByGoogleEmail(String googleEmail);
    Optional<UserIdentityProfile> findByUserId(Long userId);
    void deleteByUser(com.learnhub.entity.User user);
}
