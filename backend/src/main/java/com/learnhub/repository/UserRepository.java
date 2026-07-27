package com.learnhub.repository;

import com.learnhub.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"batch"})
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(User.Role role);
    List<User> findByBatchId(Long batchId);
    List<User> findByActiveTrue();
    List<User> findByRoleAndActiveTrue(User.Role role);
}
