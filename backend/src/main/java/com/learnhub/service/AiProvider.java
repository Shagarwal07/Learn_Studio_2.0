package com.learnhub.service;

public interface AiProvider {
    String ask(String prompt);
    boolean supports(String providerName);
}
