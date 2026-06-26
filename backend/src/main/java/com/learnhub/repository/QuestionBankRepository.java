package com.learnhub.repository;

import com.learnhub.entity.QuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, Long> {
    List<QuestionBank> findBySubject(String subject);
    List<QuestionBank> findBySubjectAndQuestionType(String subject, String questionType);
}
