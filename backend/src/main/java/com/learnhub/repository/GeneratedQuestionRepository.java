package com.learnhub.repository;

import com.learnhub.entity.GeneratedQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeneratedQuestionRepository extends JpaRepository<GeneratedQuestion, Long> {
}
