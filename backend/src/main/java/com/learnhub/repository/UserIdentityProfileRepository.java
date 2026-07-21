package com.learnhub.repository;

import com.learnhub.entity.UserIdentityProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserIdentityProfileRepository extends JpaRepository<UserIdentityProfile, Long> {
    List<UserIdentityProfile> findByGoogleEmail(String googleEmail);
    List<UserIdentityProfile> findByGoogleSub(String googleSub);
    List<UserIdentityProfile> findByUserId(Long userId);
    List<UserIdentityProfile> findByUser(com.learnhub.entity.User user);
    long countByUser(com.learnhub.entity.User user);
    void deleteByUser(com.learnhub.entity.User user);
}
