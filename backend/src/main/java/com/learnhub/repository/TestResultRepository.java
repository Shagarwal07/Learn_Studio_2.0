package com.learnhub.repository;

import com.learnhub.entity.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    List<TestResult> findByTestId(Long testId);
    List<TestResult> findByStudentId(Long studentId);
    java.util.Optional<TestResult> findByTestIdAndStudentId(Long testId, Long studentId);
    void deleteByTestId(Long testId);
}
